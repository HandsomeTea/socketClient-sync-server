import './alias';
import './exception';
import { updateOrCreateLogInstance } from '@/configs';

updateOrCreateLogInstance();

global.ClientServices = new Set();
global.ServiceSocketMap = {};
global.ServiceLimit = 3;
