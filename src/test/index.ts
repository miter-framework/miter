import { cin } from './util/cin';
import { SnakeCaseOrmTransformService } from '../services/snake-case-orm-transform.service';

(async function() {
    console.log('Hello, World!');
    let transformSvc = new SnakeCaseOrmTransformService();
    
    while (true) {
        let line = await cin.readline();
        if (line == 'exit') break;
        console.log('Model Name:', transformSvc.transformModelName(line));
        console.log('Column Name:', transformSvc.transformColumnName(line));
    }
    
    process.exit(0);
})();
