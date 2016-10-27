import { Model, Prop, Types } from './decorators';

@Model('users')
export class User {
   @Prop() name: string;
   @Prop() email: string;
}
