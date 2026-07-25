export class StockBatchResponseDto {
  id: number;
  productId: number;
  batchNumber: string;
  initialQty: number;
  currentQty: number;
  importPrice: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  createdAt: string;

  constructor(batch: any) {
    this.id = batch.id;
    this.productId = batch.productId;
    this.batchNumber = batch.batchNumber;
    this.initialQty = batch.initialQty;
    this.currentQty = batch.currentQty;
    this.importPrice = parseFloat(batch.importPrice);
    this.manufacturingDate = batch.manufacturingDate;
    this.expiryDate = batch.expiryDate;
    this.createdAt = batch.createdAt;
  }

  static toList(batches: any[]): StockBatchResponseDto[] {
    return batches.map(b => new StockBatchResponseDto(b));
  }
}

export class StockTransactionResponseDto {
  id: number;
  productId: number;
  batchId: number | null;
  type: string;
  quantity: number;
  performedBy: number;
  reason: string | null;
  createdAt: string;
  product: { id: number; code: string; name: string; unit: string } | null;
  batch: { id: number; batchNumber: string } | null;
  performer: { id: number; fullName: string } | null;

  constructor(tx: any) {
    this.id = tx.id;
    this.productId = tx.productId;
    this.batchId = tx.batchId;
    this.type = tx.type;
    this.quantity = tx.quantity;
    this.performedBy = tx.performedBy;
    this.reason = tx.reason;
    this.createdAt = tx.createdAt;
    this.product = tx.product ? { id: tx.product.id, code: tx.product.code, name: tx.product.name, unit: tx.product.unit } : null;
    this.batch = tx.batch ? { id: tx.batch.id, batchNumber: tx.batch.batchNumber } : null;
    this.performer = tx.performer ? { id: tx.performer.id, fullName: tx.performer.fullName } : null;
  }

  static toList(transactions: any[]): StockTransactionResponseDto[] {
    return transactions.map(t => new StockTransactionResponseDto(t));
  }
}
