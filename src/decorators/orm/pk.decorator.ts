import { Prop } from './prop.decorator';

export function Pk() {
   return Prop({
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      unique: true
   });
}
