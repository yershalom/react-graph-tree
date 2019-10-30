# react-graph-tree

> 

[![NPM](https://img.shields.io/npm/v/react-graph-tree.svg)](https://www.npmjs.com/package/react-graph-tree) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-graph-tree
```

## Usage

```jsx
import React, { Component } from 'react'

import Tree from 'react-graph-tree'

class Example extends Component {
  render () {
    const data = {
          'label': 'Top Level',
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
      <Tree data={data} />
    )
  }
}
```

## License

MIT © [yershalom](https://github.com/yershalom)
