export default () => Object.keys(global.ServiceSocketMap).length + (global.SingleServiceSocket ? 1 : 0);
