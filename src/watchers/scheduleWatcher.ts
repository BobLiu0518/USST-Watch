import type { IWatcher, IStudent } from '@/types/types.ts';

class ScheduleWatcher implements IWatcher {
    scheduleGot: Record<string, boolean> = {};
    constructor(public academicYear: string, public semester: string) {}

    async monitor(student: IStudent, silent: boolean): Promise<void> {
        if (this.scheduleGot[student.username]) {
            return;
        }
        const courses = await student.querySchedule(this.academicYear, this.semester);
        if (courses.length) {
            this.scheduleGot[student.username] = true;
            const msg: string[] = [];
            for (const { courseName, teacherName, weekday, coursePeriod, weeks } of courses) {
                msg.push(`${weeks} ${weekday} ${coursePeriod}：${courseName}-${teacherName}`);
            }
            console.log(`${student.name} 课表已发布`);
            console.log(msg.join('\n'));
            if (!silent) {
                student.notify(`${student.name} 课表已发布`);
                student.notify(msg.join('\n'));
            }
        }
    }
}

export function scheduleWatcher(config: { academicYear: string; semester: string }) {
    return new ScheduleWatcher(config.academicYear, config.semester);
}
