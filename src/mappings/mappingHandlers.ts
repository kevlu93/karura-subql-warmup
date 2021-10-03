import { SubstrateEvent } from "@subql/types";
import { BalanceTransferSummary } from "../types";
//import {Transfer} from "../types/models/Transfer";
import { Balance } from "@polkadot/types/interfaces";

function createBalanceTransferSummary(accountId: string): BalanceTransferSummary {
  const entity = new BalanceTransferSummary(accountId);
  entity.totalTransferIn = BigInt(0);
  entity.countTransferIn = BigInt(0);
  entity.totalTransferOut = BigInt(0);
  entity.countTransferOut = BigInt(0);
  entity.avgTransferIn = BigInt(0);
  entity.avgTransferOut = BigInt(0);
  entity.medianTransferIn = BigInt(0);
  //entity.medianTransferOut = BigInt(0);
  //entity.transfersIn = [];
  //entity.transfersOut = [];
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

  

  receiveEntity.totalTransferIn += BigInt(amount.toString());
  receiveEntity.countTransferIn += BigInt(1);
  receiveEntity.avgTransferIn = receiveEntity.totalTransferIn / receiveEntity.countTransferIn;
  //receiveEntity.transfersIn.push(BigInt(amount.toString()));
  //receiveEntity.medianTransferIn=median(receiveEntity.transfersIn);
  
  await receiveEntity.save();

  let giveEntity = await BalanceTransferSummary.get(from.toString());
  if (giveEntity == undefined) {
    giveEntity = createBalanceTransferSummary(from.toString());
  }
  
  giveEntity.totalTransferOut += BigInt(amount.toString());
  giveEntity.countTransferOut += BigInt(1);
  giveEntity.avgTransferOut = giveEntity.totalTransferOut / giveEntity.countTransferOut;
  //giveEntity.transfersOut.push(BigInt(amount.toString()));
  //giveEntity.medianTransferOut= median(giveEntity.transfersOut);

  await giveEntity.save();
}
