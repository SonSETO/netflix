import { flatten, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';

@Injectable()
export class TasksService {
  constructor() {}

  logEverySecond() {
    console.log('1초마다 실행!');
  }

  @Cron('* * * * * *')
  async eraseOrphanFiles() {
    const files = await readdir(join(process.cwd(), 'public', 'temp'));

    const deleteFilesTargets = files.filter((file) => {
      const filename = parse(file).name;

      const split = filename.split('_');

      if (split.length !== 2) {
        return true;
      }

      try {
        const date = +new Date(parseInt(split[split.length - 1]));
        const aDayInMilSec = 24 * 60 * 60 * 1000;

        const now = +new Date();

        return now - date > aDayInMilSec;
      } catch (e) {
        return true;
      }
    });

    // 병렬처리로해서 한번에 삭제
    await Promise.all(
      deleteFilesTargets.map((x) =>
        unlink(join(process.cwd(), 'public', 'temp', x)),
      ),
    );

    // 1개씩 처리
    // for(let i =0; i<deleteFilesTargets.length; i++){
    //     const fileName = deleteFilesTargets[i]

    //     await unlink(join(process.cwd(),'public', 'temp', fileName))
    // }
  }
}
