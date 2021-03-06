import React, { Component, Fragment } from 'react';

import TopSummary from './TopSummary'

class Top extends Component {

  renderEquities = () => {
    if (this.props.equities) {
      return (
        <Fragment>
          { this.props.equities.map(equity => {
            if (equity.avgTotalVolume > 100000) {
              return (
                <TopSummary
                  key={equity.symbol}
                  equity={equity}
                />
              )
            }
          })
          }
        </Fragment>
      )
    }
  }

  render() {
    return (
      <div className="equity-container">
        {this.renderEquities() }
      </div>
    )
  }
}

export default Top

// will probably have an Equity component --> that also renders the equity chart

// <div>
//   <h3>top ten {prop}</h3>
//   {/*
//     this.props[prop].map( equity => {
//       return <EquityChart />
//     })
//   */}
// </div>
