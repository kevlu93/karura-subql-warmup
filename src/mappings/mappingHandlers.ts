import { SubstrateEvent } from "@subql/types";
import { BalanceTransferSummary, Transfer } from "../types/models";
import { Balance } from "@polkadot/types/interfaces";

//Helper function to calculate the median of an array of BigInts
const median = (arr: BigInt[]) => {
  const mid = Math.floor(arr.length / 2),
    nums = arr.sort((a, b) => (a <  b) ? -1 : ((a > b) ? 1 : 0));
  return arr.length % 2 !== 0 ? BigInt(nums[mid].toString()) : (BigInt(nums[mid - 1].toString()) + BigInt(nums[mid].toString())) / BigInt(2);
};

function createBalanceTransferSummary(accountId: string): BalanceTransferSummary {
  const entity = new BalanceTransferSummary(accountId);
  entity.totalTransferIn = BigInt(0);
  entity.countTransferIn = BigInt(0);
  entity.avgTransferIn = BigInt(0);
  entity.medianTransferIn = BigInt(0);
  entity.totalTransferOut = BigInt(0);
  entity.countTransferOut = BigInt(0);
  entity.avgTransferOut = BigInt(0);
  entity.medianTransferOut = BigInt(0);
  return entity;
}

export async function handleBalanceTransferSummaryEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: {
      data: [from, to, amount],
    },
  } = event;

  let receiveEntity = await BalanceTransferSummary.get(to.toString());
  //If account is new, create BalanceTransferSummary, and save it.
  //Needs to be saved before the Transfer gets saved, since Transfer needs the BalanceTransferSummary in its from and to fields
  if (receiveEntity == undefined) {
    receiveEntity = createBalanceTransferSummary(to.toString());
    await receiveEntity.save();
  }

  let giveEntity = await BalanceTransferSummary.get(from.toString());
  if (giveEntity == undefined) {
    giveEntity = createBalanceTransferSummary(from.toString());
    await giveEntity.save();
  }

  //Handle the transfer event
  const transferInfo = new Transfer(
    `${event.block.block.header.number.toNumber()}-${event.idx}`,
  )

  transferInfo.fromId = from.toString();
  transferInfo.toId = to.toString();
  transferInfo.amount = (amount as Balance).toBigInt();
  await transferInfo.save();

  //Now we can update the summary statistics for the from and to accounts
  receiveEntity.totalTransferIn += BigInt(amount.toString());
  receiveEntity.countTransferIn += BigInt(1);
  receiveEntity.avgTransferIn = receiveEntity.totalTransferIn / receiveEntity.countTransferIn;
  let transfersIn = await Transfer.getByToId(to.toString());
  receiveEntity.medianTransferIn = median(transfersIn.map(t => t.amount));
  await receiveEntity.save();

  giveEntity.totalTransferOut += BigInt(amount.toString());
  giveEntity.countTransferOut += BigInt(1);
  giveEntity.avgTransferOut = giveEntity.totalTransferOut / giveEntity.countTransferOut;
  let transfersOut = await Transfer.getByFromId(from.toString());
  receiveEntity.medianTransferOut = median(transfersOut.map(t => t.amount));
  
  await giveEntity.save();

}
