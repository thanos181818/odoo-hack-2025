import {
    getStockTool,
    getLowStockTool,
    getLocationStockTool,
    getStockValueTool,
  } from './stockTools';
  
  import {
    createReceiptTool,
    createDeliveryTool,
    createTransferTool,
    createAdjustmentTool,
  } from './operationTools';
  
  import {
    getPendingOperationsTool,
    searchMoveHistoryTool,
    getOperationDetailsTool,
  } from './historyTools';
  
  /**
   * All available tools for Stock Oracle agent
   */
  export const allTools = [
    // Read Operations (Stock Queries)
    getStockTool,
    getLowStockTool,
    getLocationStockTool,
    getStockValueTool,
  
    // Write Operations (Create Operations)
    createReceiptTool,
    createDeliveryTool,
    createTransferTool,
    createAdjustmentTool,
  
    // History & Audit
    getPendingOperationsTool,
    searchMoveHistoryTool,
    getOperationDetailsTool,
  ];
  
  export const toolNames = allTools.map(tool => tool.name);