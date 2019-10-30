import React, { Component } from 'react'
import PropTypes from 'prop-types'

const d3 = require('d3')

export default class Tree extends Component {
  static propTypes = {
    data: PropTypes.object
  }

  normalizeNumericValue(number, divider = null, {amountMode = false, amountSymbol = '$'}) {
    if (number !== 0 && !number || !Number.isInteger(parseInt(number))) {
      console.error(`FLOW CHART: SHOULD PROVIDE INT/FLOAT VALUE (PROVIDED: ${number} WHICH IS ${typeof number}) AS INPUT`)
      return number
    }

    if (typeof number !== typeof 1) {
      number = parseInt(number)
    }

    // percentage treatment
    if (divider) {
      return `${(number / parseFloat(divider) * 100).toFixed(2)}%`
    }

    // 0 - 1k
    if (number < 1000) {
      return amountMode ? `${amountSymbol}${number}` : number
    }

    // 1k - 999k (always 4 characters besides k and dot. e.g. 123.4K and 12.34K)
    if ((number / 1000 < 1000) && (number / 1000 > 1)) {
      const numberAsString = `${(number / 1000.0).toFixed(4)}`
      const numberInK = `${numberAsString[4] === '.' ? numberAsString.substring(0, 4) : numberAsString.substring(0, 5)}K`
      return amountMode ? `${amountSymbol}${numberInK}` : numberInK
    }

    // 1m - 999m (always 4 characters besides k and dot. e.g. 123.4K and 12.34K)
    if ((number / 1000000 < 1000) && (number / 1000000 > 1)) {
      const numberAsString = `${(number / 1000000.0).toFixed(4)}`
      const numberInM = `${numberAsString[4] === '.' ? numberAsString.substring(0, 4) : numberAsString.substring(0, 5)}M`
      return amountMode ? `${amountSymbol}${numberInM}` : numberInM
    }

    // either number is huge (billions) or issue with number. any way i would like to know it.
    console.error(`flowChart having issue with number ${number}`)
    return number
  }

  normalizeData({data, mode, parent = null, amountSymbol = null}) {
    if (Object.entries(data).length === 0 && data.constructor === Object) {
      console.error('EMPTY OBJECT')
      return
    }
    if (data.children) {
      const parentValue = data
      data.children.map(child => {
        this.normalizeData({data: child, mode, parent: parentValue, amountSymbol})
      })
    }

    const nodeParentValue = parent && parent.value ? parent.value : null
    const totalValue = this.data && this.data.value ? this.data.value : null

    const percentageOfTotal = mode === '% Of Total'
    const percentageOfParent = mode === '% Of Parent'
    const amountMode = mode === 'amount' && amountSymbol && amountSymbol !== ''

    const parentValue = percentageOfTotal ? totalValue : percentageOfParent ? (nodeParentValue || data.value) : null
    data._value = this.normalizeNumericValue(data.value, parentValue, {amountMode, amountSymbol})
    return data
  }

  componentDidMount() {
    document.getElementById('svgHolder').innerHTML = ''

    // ************** BASE VARIABLES **************

    const mode = ''
    const amountSymbol = '%'

    const root = this.normalizeData({data: this.props.data, mode, amountSymbol})

    // dimensions
    const widthOfOneNode = 200
    const heightOfOneNode = 60
    const spacingOfNodes = 20
    const parentTimesSize = 3
    const parentTimesToSide = 2
    const marginLeaf = 3
    const margin = {top: 20, right: 120, bottom: 20, left: 120}
    const width = calculateWidth(root) - margin.right - margin.left
    const height = calculateHeight(root) - margin.top - margin.bottom

    // circles
    //  entrance
    const entranceCircleSize = 10
    const entranceCircleColor = 'white'

    //  actual
    const baseCircleSize = 50
    const baseCircleColor = 'white'
    const baseCircleStrokeColor = '#25b7ce'

    // chart config
    const tree = d3.layout.tree().size([height, width])

    const commasAndDotsRegex = /[.,\s]/g
    const item = document.getElementById('svgHolder')
    const svg = d3.select(item).insert('svg')
      .attr('width', width + margin.right + margin.left)
      .attr('height', height + margin.top + margin.bottom)
      .insert('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    let i = 0
    const collapsibleTree = false
    root.x0 = height / 2
    root.y0 = 0

    // ************** END OF BASE VARIABLES **************

    generateChart(root)

    // ************** TREE FUNCTIONS **************

    // getting width
    function getDepth(object) {
      let depth = 0
      if (object.children) {
        object.children.forEach(function (d) {
          const tempDepth = getDepth(d)
          if (tempDepth > depth) {
            depth = tempDepth
          }
        })
      }
      return 1 + depth
    }

    // getting height

    function diameterOfBinaryTree(root) {
      // let max = 0;
      // dfs(root, max);
      // return max;
      //
      // function dfs(node, max) {
      //   if (!node) {
      //     return 0;
      //   }
      //   const dl = dfs(node.children ? dfs(node.children[0]) : 0, max);
      //   const dr = dfs(node.children && node.children.length > 1 ? dfs(node.children[1]) : 0, max);
      //   const newMax = Math.max(max, dl + dr);
      return 7
      // }
    }

    // ************** END OF TREE FUNCTIONS **************
    // ************** WIDTH AND HEIGHT CALCULATIONS **************

    function calculateWidth(data) {
      const deepestDepth = getDepth(data)
      return deepestDepth * (widthOfOneNode + spacingOfNodes)
    }

    function calculateHeight(data) {
      let max
      const widthOfTree = diameterOfBinaryTree(data)
      return widthOfTree * (heightOfOneNode + spacingOfNodes)
    }

    // ************** END OF WIDTH AND HEIGHT CALCULATIONS **************
    // ************** START OF GENERATING CHART **************

    function generateChart(source) {
      // Compute the new tree layout.
      const nodes = tree.nodes(root).reverse()
      const links = tree.links(nodes)

      // Normalize for fixed-depth.
      nodes.forEach(function (d) {
        d.y = d.depth * widthOfOneNode
      })

      // Update the nodes…
      const node = svg.selectAll('g.node')
        .data(nodes, function (d) {
          return d.id || (d.id = ++i)
        })

      // Update the links…
      const link = svg.selectAll('line').data(links, function (d) {
        return d.target.id
      })

      connectAllNodes(link)

      const nodeEnter = node.enter().insert('g')
        .attr('class', 'node')
        .attr('transform', function (d) {
          return 'translate(' + source.y0 + ',' + source.x0 + ')'
        })
        .on('click', function (d) {
          if (!isMaster(d) && !isLeaf(d) && collapsibleTree) {
            return click(d)
          }
          return null
        }).attr('transform', function (d) {
          return 'translate(' + d.y + ',' + d.x + ')'
        })

      createCircle(nodeEnter.insert('rect'), baseCircleSize, 1, baseCircleColor, baseCircleStrokeColor)
      // createValueCircle(nodeEnter.insert('rect'), 1);

      createTextOnCircles(nodeEnter, entranceCircleSize)
      // createTextValue(nodeEnter);

      // Stash the old positions for transition.
      nodes.forEach(function (d) {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }
      generateChart(d)
    }

    function createTextValue(nodeEnter) {
      nodeEnter.insert('text')
        .attr('y', function (d) {
          const isLeafY = 5
          const nonLeafY = -20
          const y = isLeaf(d) ? isLeafY : nonLeafY
          const dMargin = (d.marginTop || 0) - (d.marginBottom || 0)
          const calculation = y + dMargin
          return `${calculation}px`
        })
        .attr('x', function (d) {
          const isLeafX = 90
          const nonLeafX = 55
          const x = isLeaf(d) ? isLeafX : nonLeafX
          const dMargin = (d.marginLeft || 0) - (d.marginRight || 0)
          const calculation = x + dMargin
          return `${calculation}px`
        })
        .attr('text-anchor', 'end')
        .attr('font-weight', '600')
        .attr('fill', function (d) {
          return isLeaf(d) ? 'black' : 'white'
        })
        .style('cursor', function (d) {
          if ((isLeaf(d) || isMaster(d)) || !collapsibleTree) {
            return 'default'
          }
          return 'pointer'
        })
        .text(function (d) {
          return d._value ? d._value : d.value
        }) // todo: ellipsis.
    }

    function createTextOnCircles(nodeEnter, circleSize) {
      nodeEnter.insert('text')
        .attr('y', function (d) {
          const y = 5
          const calculation = y + (d.marginTop || 0) - (d.marginBottom || 0)
          return `${calculation}px`
        })
        .attr('x', function (d) {
          const isLeafX = -40
          const nonLeafX = 0
          const masterX = -25
          const x = isLeaf(d) ? isLeafX : isMaster(d) ? masterX : nonLeafX
          const dMargin = (d.marginLeft || 0) - (d.marginRight || 0)
          const calculation = x + dMargin
          return `${calculation}px`
        })
        .attr('text-anchor', function (d) {
          return isLeaf(d) ? 'start' : 'middle'
        })
        .attr('font-size', function (d) {
          return d.label.length > 12 || isLeaf(d) ? '12' : '14'
        })
        .style('cursor', function (d) {
          if ((isLeaf(d) || isMaster(d)) || !collapsibleTree) {
            return 'default'
          }
          return 'pointer'
        })
        .text(function (d) {
          return d.label
        }) // todo: ellipsis.
    }

    function isLeaf(d) {
      return !d.children && !d._children
    }

    function isMaster(d) {
      return !d.parent
    }

    function createValueCircle(node, fill) {
      node
        .attr('width', function (d) {
          const baseWidth = marginLeaf * 2
          const letterPxLength = 8
          const commaPxLength = 3
          const pickedValue = String(!isNaN(d._value) || !!d._value ? d._value : !isNaN(d.value) || !!d.value ? d.value : '')
          const letters = pickedValue.replace(commasAndDotsRegex, '')
          return isLeaf(d) ? 0 : `${baseWidth + (letters.length * letterPxLength) + ((pickedValue.length - letters.length) * commaPxLength)}px`
        })
        .attr('height', function (d) {
          return isLeaf(d) ? 0 : '18px'
        })
        .attr('x', function (d) {
          const baseX = 56 - marginLeaf
          const pickedValue = String(!isNaN(d._value) || !!d._value ? d._value : !isNaN(d.value) || !!d.value ? d.value : '')
          const letters = pickedValue.replace(commasAndDotsRegex, '')
          const letterPxLength = 8
          const commaPxLength = 3
          const x = baseX - (letterPxLength * letters.length) - ((pickedValue.length - letters.length) * commaPxLength)
          const dMargin = (d.marginLeft || 0) - (d.marginRight || 0)
          const calculation = x + dMargin
          return `${calculation}px`
        })
        .attr('y', function (d) {
          const y = -34
          const calculation = y + (d.marginTop || 0) - (d.marginBottom || 0)
          return `${calculation}px`
        })
        .attr('rx', '8px')
        .attr('ry', '8px')
        .attr('fill-opacity', fill)
        .style('fill', function (d) {
          return d.stroke || d.fill || baseCircleStrokeColor
        })
        .style('stroke', function (d) {
          return d.stroke || d.fill || baseCircleStrokeColor
        })
        .style('stroke-width', '4px')
    };

    function createCircle(node, circleSize, fillOpacity, fill, stroke) {
      node
        .attr('width', function (d) {
          if (isMaster(d)) {
            return circleSize * parentTimesSize
          }
          if (isLeaf(d)) {
            return circleSize * 3
          }
          return circleSize * 2
        })
        .attr('height', function (d) {
          if (isMaster(d)) {
            return circleSize * parentTimesSize
          }
          if (isLeaf(d)) {
            return '25'
          }
          return circleSize * 2
        })
        .attr('x', function (d) {
          const masterY = -(parentTimesToSide * circleSize)
          const leafY = -circleSize
          const nonLeafY = -circleSize
          const y = isMaster(d) ? masterY : isLeaf(d) ? leafY : nonLeafY
          const dMargin = (d.marginLeft || 0) - (d.marginRight || 0)
          const calculation = y + dMargin
          return `${calculation}px`
        })
        .attr('y', function (d) {
          const masterY = -(parentTimesSize / parentTimesToSide) * circleSize
          const leafY = -12
          const nonLeafY = -circleSize
          const y = isMaster(d) ? masterY : isLeaf(d) ? leafY : nonLeafY
          const dMargin = (d.marginTop || 0) - (d.marginBottom || 0)
          const calculation = y + dMargin
          return `${calculation}px`
        })
        .attr('rx', function (d) {
          if (isMaster(d)) {
            return parentTimesSize * circleSize
          }
          if (isLeaf(d)) {
            return '10px'
          }
          return circleSize
        })
        .attr('ry', function (d) {
          if (isMaster(d)) {
            return parentTimesSize * circleSize
          }
          if (isLeaf(d)) {
            return '10px'
          }
          return circleSize
        })
        .attr('fill-opacity', fillOpacity)
        .style('fill', function (d) {
          return d.fill ? d.fill : fill
        })
        .style('stroke', function (d) {
          return d.stroke ? d.stroke : stroke
        })
        .style('stroke-width', '2px')
    }

    function connectAllNodes(link) {
      // end point to halves
      link.enter().insert('line')
        .attr('class', 'flow-link')
        .attr('x1', function (d) {
          const targetMargins = (d.target.marginLeft || 0) - (d.target.marginRight || 0)
          return d.target.y + targetMargins
        })
        .attr('y1', function (d) {
          const targetMargins = (d.target.marginTop || 0) - (d.target.marginBottom || 0)
          return d.target.x + targetMargins
        })
        .attr('x2', function (d) {
          // todo: add (sourceMargin * 2/5) and (targetMargin * 3/5)
          return d.source.y * (2 / 5) + d.target.y * (3 / 5)
        })
        .attr('y2', function (d) {
          const targetMargins = (d.target.marginTop || 0) - (d.target.marginBottom || 0)
          return d.target.x + targetMargins
        })
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', 4)
        .attr('stroke', 'lightgray')

      // start points to their halves
      link.enter().insert('line')
        .attr('class', 'flow-link')
        .attr('x1', function (d) {
          // todo: add (sourceMargin * 2/5) and (targetMargin * 3/5)
          return d.source.y * (2 / 5) + d.target.y * (3 / 5)
        })
        .attr('y1', function (d) {
          const sourceMargins = (d.source.marginTop || 0) - (d.source.marginBottom || 0)
          return d.source.x + sourceMargins
        })
        .attr('x2', function (d) {
          const sourceMargins = (d.source.marginLeft || 0) - (d.source.marginRight || 0)
          return d.source.y + sourceMargins
        })
        .attr('y2', function (d) {
          const sourceMargins = (d.source.marginTop || 0) - (d.source.marginBottom || 0)
          return d.source.x + sourceMargins
        })
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', 4)
        .attr('stroke', 'lightgray')

      // connects lines vertically
      link.enter().insert('line')
        .attr('class', 'flow-link')
        .attr('class', 'flow-link')
        .attr('x1', function (d) {
          // todo: add (sourceMargin * 2/5) and (targetMargin * 3/5)
          return d.source.y * (2 / 5) + d.target.y * (3 / 5)
        })
        .attr('y1', function (d) {
          const sourceMargins = (d.source.marginTop || 0) - (d.source.marginBottom || 0)
          return d.source.x + sourceMargins
        })
        .attr('x2', function (d) {
          // todo: add (sourceMargin * 2/5) and (targetMargin * 3/5)
          return d.source.y * (2 / 5) + d.target.y * (3 / 5)
        })
        .attr('y2', function (d) {
          const targetMargins = (d.target.marginTop || 0) - (d.target.marginBottom || 0)
          return d.target.x + targetMargins
        })
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', 4)
        .attr('stroke', 'lightgray')
    }
  }

  render() {
    return <div id='svgHolder' />
  }
}
