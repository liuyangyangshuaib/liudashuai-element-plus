import message from './src/method.mjs';
export { messageDefaults, messageEmits, messageProps, messageTypes } from './src/message2.mjs';
import { withInstallFunction } from '../../utils/vue/install.mjs';

const ElMessage = withInstallFunction(message, "$message");

export { ElMessage, ElMessage as default };
//# sourceMappingURL=index.mjs.map
