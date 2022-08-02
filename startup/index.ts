import './alias';
import './exception';
import { updateOrCreateLogInstance } from '@/configs';

updateOrCreateLogInstance();

// global.ServiceLimit = 1;
global.ServiceCount = 0;
global.ClientCount = 0;
