import { B } from './b';

export class A {
    static b = () => B;
    static b_inst: B;
    
    a_local: number;
};
