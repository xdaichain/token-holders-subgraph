import { BigInt, Address, store, log } from '@graphprotocol/graph-ts';
import { Transfer, ERC20 } from '../generated/Stake/ERC20';
import { Token, Holder } from '../generated/schema';

function updateBalance(tokenAddress: Address, holderAddress: Address, value: BigInt, increase: boolean): void {
  if (holderAddress.toHexString() == '0x0000000000000000000000000000000000000000') return;
  let id = tokenAddress.toHex() + '-' + holderAddress.toHex();
  let holder = Holder.load(id);
  if (holder == null) {
    holder = new Holder(id);
    holder.address = holderAddress;
    holder.balance = BigInt.fromI32(0);
    holder.token = tokenAddress.toHex();
  }
  holder.balance = increase ? holder.balance.plus(value) : holder.balance.minus(value);
  if (holder.balance.isZero()) {
    store.remove('Holder', id);
  } else {
    holder.save();
  }
}

function updateTotalSupply(address: Address): void {
  let contract = ERC20.bind(address);
  let token = Token.load(address.toHex());
  if (token == null) {
    token = new Token(address.toHex());
    token.address = address;
    token.totalSupply = BigInt.fromI32(0);
  }
  token.totalSupply = contract.totalSupply();
  token.save();
}

export function handleTransfer(event: Transfer): void {
  updateTotalSupply(event.address);
  updateBalance(event.address, event.params.from, event.params.value, false);
  updateBalance(event.address, event.params.to, event.params.value, true);
}
