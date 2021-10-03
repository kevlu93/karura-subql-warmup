import { SubstrateEvent } from "@subql/types";
import { BalanceTransferSummary } from "../types/models/BalanceTransferSummary";
import {Transfer} from "../types/models/Transfer";
import { Balance } from "@polkadot/types/interfaces";

const median = (arr) => {
  const mid = Math.floor(arr.length / 2),
    nums = [...arr].sort((a, b) => a - b);
  return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

function createBalanceTransferSummary(accountId: string): BalanceTransferSummary {
  const entity = new BalanceTransferSummary(accountId);
  entity.totalTransferIn = BigInt(0);
  entity.countTransferIn = BigInt(0);
  entity.totalTransferOut = BigInt(0);
  entity.countTransferOut = BigInt(0);
  return entity;
}

export async function handleBalanceTransferSummaryEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [from, to, amount],
    },
  } = event;

  
  

  let receiveEntity = await BalanceTransferSummary.get(to.toString());
  if (receiveEntity == undefined) {
    receiveEntity = createBalanceTransferSummary(to.toString());
  }

  let giveEntity = await BalanceTransferSummary.get(from.toString());
  if (giveEntity == undefined) {
    giveEntity = createBalanceTransferSummary(from.toString());
  }

  const transferInfo = new Transfer(
    `${event.block.block.header.number.toNumber()}-${event.idx}`,
  )

  transferInfo.fromId = from.toString();
  transferInfo.toId = to.toString();
  transferInfo.amount = (amount as Balance).toBigInt();

  receiveEntity.totalTransferIn += BigInt(amount.toString());
  receiveEntity.countTransferIn += BigInt(1);
  receiveEntity.avgTransferIn = receiveEntity.totalTransferIn / receiveEntity.countTransferIn;
  
 // receiveEntity.medianTransferIn = median(receiveEntity.transfersIn)
  await receiveEntity.save();

  
  giveEntity.totalTransferOut += BigInt(amount.toString());
  giveEntity.countTransferOut += BigInt(1);
  giveEntity.avgTransferOut = giveEntity.totalTransferOut / giveEntity.countTransferOut;
  
  await giveEntity.save();
}
