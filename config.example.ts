import { addStudent } from '@/student.ts';
import { scoreWatcher } from '@/watchers/scoreWatcher.ts';
import { scheduleWatcher } from '@/watchers/scheduleWatcher.ts';

// 添加用户
await addStudent({
    // 学号
    username: '234567890',
    // 密码（base64后）
    password: 'cGEzM3cwcmQ=',
    // HTTP Post 地址（可选）
    post: 'http://127.0.0.1:5701/send_private_msg?user_id=11451419&message=',
    // 通知函数（可选），和 Post 地址二选一（同时存在时只使用 notify）
    // notify: (msg: string) => {
    //     console.log(msg);
    // },
    // 要监控的项目
    watcher: [
        // 成绩监控
        scoreWatcher({
            // 学年
            academicYear: '2024',
            // 学期
            semester: '3',
            // 是否展示具体分数
            showScore: true,
        }),
        // 课程表监控（适用于一轮选课后）
        scheduleWatcher({
            // 学年
            academicYear: '2024',
            // 学期
            semester: '4',
        }),
    ],
});

// 可以添加多个用户
// await addStudent({...
