import { Buffer } from 'node:buffer';

export type StudentConfig = {
    username: string;
    password: string;
};

export type queryScoreArgs = {
    academicYear: string;
    semester: string | null;
};

export default class Student {
    username: string;
    password: string;
    cookies = {};
    constructor(config: StudentConfig) {
        this.username = config.username;
        this.password = Buffer.from(config.password, 'base64').toString('utf-8');
    }
    async login(): Promise<boolean> {
        try {
            let response = await this.request('http://ehall.usst.edu.cn/amp-auth-adapter/login?service=http%3A%2F%2Fjwgl.usst.edu.cn%2Fsso%2Fjziotlogin');
            let url = response.url;
            let inputs = {
                lt: '',
                dllt: '',
                execution: '',
                _eventId: '',
                rmShown: '',
            };
            const body = await response.text();
            for (let key in inputs) {
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
            return true;
        } catch (err) {
            console.error(`用户 ${this.username} 登录时出现问题：`);
            console.error(err);
            return false;
        }
    }
    async queryScore(args: queryScoreArgs): Promise<Object> {
        const response = await this.request('https://jwgl.usst.edu.cn/jwglxt/cjcx/cjcx_cxXsgrcj.html?doType=query&gnmkdm=N305005', {
            method: 'POST',
            body: new URLSearchParams({
                xnm: args.academicYear,
                xqm: args.semester ?? '',
                kcbj: '',
                _search: 'false',
                nd: Date.now().toString(),
                'queryModel.showCount': '5000',
                'queryModel.currentPage': '1',
                'queryModel.sortName': '',
                'queryModel.sortOrder': 'asc',
                time: '0',
            }),
        });
        return JSON.parse(await response.text())['items'];
    }
    async request(url: string, init: RequestInit = {}): Promise<Response> {
        init.headers = {
            ...init.headers,
            Cookie: Object.entries(this.cookies)
                .map(([key, value]) => `${key}=${value}`)
                .join('; '),
        };
        let response = await fetch(url, init);
        for (let cookie of response.headers.getSetCookie()) {
            cookie = cookie.split(';')[0];
            let [key, value] = cookie.split('=');
            this.cookies[key] = value;
        }
        return response;
    }
}
