import { types } from 'mobx-state-tree';
import BigNumber from 'bignumber.js'

const BigNumberPrimitive = types.custom({
  name: 'BigNumber',
  fromSnapshot(value) {
    return BigNumber(value);
  },
  toSnapshot(value) {
    return value.toString();
  },
  isTargetType(value) {
    return BigNumber.isBigNumber(value);
  },
  getValidationMessage(value) {
    let converted = BigNumber(value)
    return converted.isNaN() ? `${value} does not look like a valid number` : '';
  }
})

export default BigNumberPrimitive;