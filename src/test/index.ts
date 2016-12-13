// import { cin } from './util/cin';
// import { SnakeCaseOrmTransformService } from '../services/snake-case-orm-transform.service';

// (async function() {
//     console.log('Hello, World!');
//     let transformSvc = new SnakeCaseOrmTransformService();
    
//     while (true) {
//         let line = await cin.readline();
//         if (line == 'exit') break;
//         console.log('Model Name:', transformSvc.transformModelName(line));
//         console.log('Column Name:', transformSvc.transformColumnName(line));
//     }
    
//     process.exit(0);
// })();

// import { CtorT } from '../core';
// import { Test } from './decorators/test.decorator';
// import { ClassNopsSym } from './metadata';
// import 'reflect-metadata';

// class A {
//     @Test()
//     func_a() {
        
//     }
// }
// class B extends A {
//     @Test()
//     func_b() {
        
//     }
// }

// function listNops(target: CtorT<Object>): string[] {
//     let nops: string[] = [];
//     while (target) {
//         let newNops = Reflect.getOwnMetadata(ClassNopsSym, target.prototype) || [];
//         nops = [...newNops, ...nops];
//         let proto = Object.getPrototypeOf(target.prototype);
//         target = proto && proto.constructor;
//     }
//     return nops;
// }

// (() => {
//     let nops = JSON.stringify(listNops(B));
//     console.log(nops);
    
//     process.exit(0);
// })();

import { A } from './a';
import { B } from './b';

(function() {
    console.log(A);
    console.log(B);
    console.log(A.b() === B);
    console.log(B.a() === A);
    
    A.b_inst.b_local;
    B.a_inst.a_local;
    
    process.exit(0);
})();
