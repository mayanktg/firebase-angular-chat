import { Injectable} from '@angular/core';

@Injectable()
export class StackService {
  public data: any;

  constructor() {
    this.data = {
      inputCount: 0,
      outputs: [],
      inputs: []
    };
  }

  getCurrentData () {
    return this.data;
  }

  getResult() {
    return this.data['outputs'];
  }

  starOpr(numericText: number) {
    this.data['inputCount'] = numericText;
  }

  pushOpr(pushStack: number) {
  }

  popOpr() {
  }
}
