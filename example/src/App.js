import React, {Component} from 'react'

import Tree from 'react-graph-tree'

export default class App extends Component {
  transformData = (dataArr, type) => {
    const data = dataArr[0]
    if (data[type] && data[type].length > 0) {
      return data[type].map(input => {
        return {
          label: input
        }
      })
    }
  };
  MOCK_ATTRIBUTES_DATA = [
    {
      name: 'metal',
      repo: 'forter',
      docu: 'most important music genre',
      calc: 'end',
      inputs: ['rock', 'blues', 'jazz', 'pop'],
      outputs: ['POWER METAL'],
      timeline: {
        p75: 450.5,
        p90: 470.9,
        p99: 501.1,
        'p99.9': 550
      }
    }
  ];
  render() {
    const data = {
      'label': '',
      'fill': 'red',
      'stroke': 'red',
      'children': this.transformData(this.MOCK_ATTRIBUTES_DATA, 'inputs')
    }

    return (
      <div>
        <Tree data={data} direction={`rtl`} id={`h`} />
        <Tree data={data} direction={`rtl`} id={`q`} />
      </div>
    )
  }
}
