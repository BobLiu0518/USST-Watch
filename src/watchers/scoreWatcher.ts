import type { IWatcher, IStudent } from '@/types/types.ts';

class ScoreWatcher implements IWatcher {
    scoreStore: Record<string, Record<string, number>> = {};
    constructor(
        public academicYear: string,
        public semester: string = '',
        public showScore: boolean = false
    ) {}

    async monitor(student: IStudent, silent: boolean): Promise<void> {
        if (!this.scoreStore[student.username]) {
            this.scoreStore[student.username] = {};
        }
        const scores = await student.queryScore(
            this.academicYear,
            this.semester
        );
        for (const { courseName, score: scoreStr } of scores) {
            const courseScore = parseInt(scoreStr);
            const oldScore = this.scoreStore[student.username][courseName];
            if (oldScore != courseScore) {
                const status = oldScore === undefined ? '发布' : '更新';
                const msg = this.showScore
                    ? `${student.name} ${courseName} 成绩已${status}：${courseScore}`
                    : `${student.name} ${courseName} 成绩已${status}，点击查看：https://jwgl.usst.edu.cn/sso/jziotlogin`;
                this.scoreStore[student.username][courseName] = courseScore;
                console.log(msg);
                if (!silent) {
                    student.notify(msg);
                }
            }
        }
    }
}

export function scoreWatcher(config: {
    academicYear: string;
    semester?: string;
    showScore?: boolean;
}) {
    return new ScoreWatcher(
        config.academicYear,
        config.semester,
        config.showScore
    );
}
