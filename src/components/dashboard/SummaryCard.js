import React, { Component } from 'react'

import SmallCard from './SmallCard'

class SummaryCard extends Component {
  state = {
    tickers: [],
    equities: [],
  }

  componentDidMount() {
    let tickers = this.props.dashboard.equities.map(e => e.symbol + ' | ')
    this.setState({ tickers })
  }


  render() {
    return (
      <div className="summary-card">
        <h3> {this.props.dashboard.name} </h3>
        <h6> | {this.state.tickers} </h6>
        {
          this.props.dashboard.equities.map(equity => {
            return (
              <SmallCard
                key={equity.id}
                ticker={equity.symbol}
                name={equity.company_name}
                equity={equity}
              />
            )
          })
        }
      </div>
    )
  }

}

export default SummaryCard
