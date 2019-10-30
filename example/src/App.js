import React, { Component } from 'react'

import Tree from 'react-graph-tree'

export default class App extends Component {
  render () {
    const data = {
      'label': 'Top Level',
      'fill': 'red',
      'stroke': 'red',
      'children': [
        {
          'label': 'Level 2: A',
          'children': [
            {
              'label': 'Son of A'
            },
            {
              'label': 'Daughter of A'
            }
          ]
        },
        {
          'label': 'Level 2: B'
        }
      ]
    }

    return (
      <div>
        <Tree data={data} direction={`rtl`} />
      </div>
    )
  }
}
