import { Model, Prop } from './decorators';

@Model('users')
export class User {
   @Prop() name: string;
   @Prop() email: string;
}
