import { renameKey } from '@/util.ts';
import type { UserConfig, Score, IWatcher, IStudent } from '@/types/types.ts';

const students: Student[] = [];

export async function addStudent(config: UserConfig): Promise<void> {
    const student = new Student(config);
    if (await student.login()) {
        students.push(student);
    }
}

export async function monitorAll(silent: boolean = false): Promise<void> {
    for (const student of students) {
        try {
            await Promise.all(student.watcher.map((watcher) => watcher.monitor(student, silent)));
        } catch (err) {
            console.error(`获取 ${student.name} 数据时发生错误：`);
            console.error(err);
            console.error('尝试重新登录…');
            await student.login(true);
        }
    }
}

class Student implements IStudent {
    username: string;
    password: string;
    name: string | null = null;
    watcher: IWatcher[];
    notify: (msg: string) => void;
    cookies: Record<string, string> = {};
    constructor(config: UserConfig) {
        this.username = config.username;
        this.password = atob(config.password);
        this.watcher = config.watcher;
        if (config.notify !== undefined) {
            this.notify = config.notify;
        } else if (config.post !== undefined) {
            this.notify = (msg: string) => {
                const url = typeof config.post === 'function' ? config.post(msg) : config.post + msg;
                fetch(url).catch((err) => {
                    console.error('发送消息时发生错误：');
                    console.error(err);
                });
            };
        } else {
            this.notify = () => {};
        }
    }
    async login(reLogin: boolean = false): Promise<boolean> {
        if (this.name && !reLogin) {
            return true;
        }
        this.name = null;
        try {
            let response = await this.request('http://ehall.usst.edu.cn/amp-auth-adapter/login?service=http%3A%2F%2Fjwgl.usst.edu.cn%2Fsso%2Fjziotlogin');
            let url = response.url;
            const inputs: Record<string, string> = {
                lt: '',
                dllt: '',
                execution: '',
                _eventId: '',
                rmShown: '',
            };
            const body = await response.text();
            for (const key in inputs) {
                const pattern = new RegExp(`<input type="hidden" name="${key}" value="(.*?)"\/?>`);
                inputs[key] = (body.match(pattern) ?? [])[1];
            }
            response = await this.request(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: this.username,
                    password: this.password,
                    ...inputs,
                }),
                redirect: 'manual',
            });
            while (response.status == 302) {
                url = response.headers.get('location') ?? '/';
                url = url.replace(/^(http):\/\/jwgl\.usst\.edu\.cn/, 'https://jwgl.usst.edu.cn');
                if (url.match(/^\//)) {
                    url = 'https://jwgl.usst.edu.cn' + url;
                }
                response = await this.request(url, {
                    redirect: 'manual',
                });
            }
            const name = await this.queryName();
            if (!name) {
                return false;
            }
            console.log(`${name}(${this.username}) 登录成功`);
            return true;
        } catch (err) {
            console.error(`${this.username} 登录时出现问题：`);
            console.error(err);
            return false;
        }
    }
    async queryName(): Promise<string | null> {
        if (this.name) {
            return this.name;
        }
        const response = await this.request(`https://jwgl.usst.edu.cn/jwglxt/xtgl/index_cxYhxxIndex.html?xt=jw&localeKey=zh_CN&_=${Date.now()}&gnmkdm=index`);
        const body = await response.text();
        const match = body.match(/<h4 class="media-heading">(.+?)&nbsp;/);
        if (!match) {
            return null;
        }
        this.name = match[1];
        return this.name;
    }
    async queryScore(academicYear: string, semester?: string): Promise<Score[]> {
        if (!this.name && !(await this.login())) {
            return [];
        }
        const response = await this.request('https://jwgl.usst.edu.cn/jwglxt/cjcx/cjcx_cxXsgrcj.html?doType=query&gnmkdm=N305005', {
            method: 'POST',
            body: new URLSearchParams({
                xnm: academicYear,
                xqm: semester ?? '',
                kcbj: '',
                _search: 'false',
                nd: Date.now().toString(),
                'queryModel.showCount': '5000',
                'queryModel.currentPage': '1',
                'queryModel.sortName': '',
                'queryModel.sortOrder': 'asc',
                time: '0',
            }),
            redirect: 'manual',
        });
        if (response.status == 901) {
            throw new Error('登录已失效');
        }
        const scores = (await response.json())['items'];
        const keyMap = {
            cj: 'score',
            jd: 'gpa',
            jsxm: 'teacherName',
            jxbmc: 'teachingClass',
            kcbj: 'courseTag',
            kccjpm: 'courseRank',
            kclbmc: 'courseType',
            kcmc: 'courseName',
            khfsmc: 'assessmentMethod',
            xn: 'academicYear',
            xq: 'semester',
            xf: 'credit',
            xfjd: 'creditGpa',
        };
        return renameKey(scores, keyMap);
    }
    async request(url: string, init: RequestInit = {}): Promise<Response> {
        init.headers = {
            ...init.headers,
            Cookie: Object.entries(this.cookies)
                .map(([key, value]) => `${key}=${value}`)
                .join('; '),
            'User-Agent': 'B',
        };
        const response = await fetch(url, init);
        for (let cookie of response.headers.getSetCookie()) {
            cookie = cookie.split(';')[0];
            const [key, value] = cookie.split('=');
            this.cookies[key] = value;
        }
        return response;
    }
}
