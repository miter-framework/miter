import { Service } from 'decorators';
import { TestService } from './test.service';

@Service()
export class AuthService {
   constructor(private testService: TestService) {
      testService.testServiceFn();
   }
   
   meaningOfLife() { return 42; }
}
