import { monitorAll } from '@/student.ts';
import '$/config.ts';

await monitorAll(true);
setInterval(() => monitorAll(), 5 * 60 * 1000);
