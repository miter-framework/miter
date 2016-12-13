import { A } from './a';

export class B {
    static a = () => A;
    static a_inst: A;
    
    b_local: number;
};
