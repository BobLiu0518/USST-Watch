export interface IWatcher {
    monitor(student: IStudent, silent: boolean): Promise<void>;
}

export interface IStudent {
    username: string;
    password: string;
    name: string | null;
    watcher: IWatcher[];
    notify: (msg: string) => void;
    cookies: Record<string, string>;
    login(reLogin: boolean): Promise<boolean>;
    queryScore(academicYear: string, semester: string): Promise<Score[]>;
}

export type UserConfig = {
    username: string;
    password: string;
    watcher: IWatcher[];
    post?: string | ((msg: string) => string);
    notify?: (msg: string) => void;
};

export type Score = {
    score: string;
    gpa: string;
    teacherName: string;
    teachingClass: string;
    courseTag: string;
    courseRank: string;
    courseType: string;
    courseName: string;
    assessmentMethod: string;
    academicYear: string;
    semester: string;
    credit: string;
    creditGpa: string;
};
