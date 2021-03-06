import React, { Component, Fragment } from 'react'

import EquityChart from './EquityChart'


import { NavLink } from 'react-router-dom';

import { connect } from 'react-redux';

class Equity extends Component {
  state ={
    data: {
      labels: [],
      datasets: [{
            label: '',
            pointBorderColor: 'rgb(255,255,255,0)',
            lineTension: 0,
            data: []
        }]
    },
    legend: {
      display: false,
    },
    options: {
      scales: {
        xAxes: [{
          ticks: {
            display: false, // show label
            fontColor: 'rgba(255,255,255,1)'
          },
          gridLines: {
            display: false,
            color: 'rgba(255,255,255,0.5)'
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: 'rgba(255,255,255,1)'
          },
          gridLines: {
            display: false,
            color: 'rgba(255,255,255,0.5)'
          }
        }]
      }
    },
    stats: {},
    showTradeForm: false,
    currentPrice: "",
    quantity: 0,
    addEquityId: 0,
    addDashboardId: 0,
    addedToDashboard: false,
  }


  /**********************************************
                LIFECYCLE FUNCTIONS
  **********************************************/
  componentDidMount() {
    // if current time is between market hours, fetch intraday
    // else fetch from post close 1d cata
    let t = new Date().getMonth()+1 + '/' + new Date().getDate() + '/' + new Date().getFullYear()
    let open = t + ' 09:30:00 GMT-0400'
    let close = t + ' 16:00:00 GMT-0400'
    let now = new Date()

    if (now.getDay() > 5) {
      if (now.getDay() === 6 ) {
        if (now.getMonth() + 1 < 10) {
          if (now.getDate() < 11) {
            let date = `${now.getFullYear()}0${now.getMonth()+1}0${now.getDate()-1}`
            this.fetchFromDate(date)
          } else {
            let date = `${now.getFullYear()}0${now.getMonth()+1}${now.getDate()-1}`
            this.fetchFromDate(date)
          }
        } else {
          if (now.getDate() < 11) {
            let date = `${now.getFullYear()}0${now.getMonth()+1}0${now.getDate()-1}`
            this.fetchFromDate(date)
          } else {
            let date = `${now.getFullYear()}0${now.getMonth()+1}${now.getDate()-1}`
            this.fetchFromDate(date)
          }
        }
      } else if (now.getDay() === 7 ) {
        if (now.getMonth() + 1 < 10) {
          if (now.getDate() < 11) {
            let date = `${now.getFullYear()}0${now.getMonth()+1}0${now.getDate()-2}`
          } else {
            let date = `${now.getFullYear()}0${now.getMonth()+1}${now.getDate()-2}`
          }
        } else {
          if (now.getDate() < 11) {
            let date = `${now.getFullYear()}0${now.getMonth()+1}0${now.getDate()-2}`
          } else {
            let date = `${now.getFullYear()}0${now.getMonth()+1}${now.getDate()-2}`
          }
        }
      }
    } else if (Date.parse(now) >= Date.parse(open) && Date.parse(now) <= Date.parse(close)) {
      this.fetchIntradayData()
    } else {
      this.fetchPostCloseTradeData()
    }
    this.fetchStatsData()
    // window.setInterval(this.fetchCurrentPrice, 5000)
    this.fetchCurrentPrice()
  }

  /**********************************************
            EVENT / CHANGE STATE FUNCTIONS
  **********************************************/
  setDatapoints = (json) => {
    // debugger
    let datapoints = json.map( d => {
      if (!!d.average && d.average > -1) {
        return d.average
      } else if (!!d.marketAverage && d.marketAverage > -1){
        return d.marketAverage
      }
    })

    let labels = json.map( d => d.label)

    this.setState({
      data: {
        labels: labels,
        datasets: [{
              label: '',
              backgroundColor: 'rgb(0,0,0,0)',
              borderColor: '#2bcbba',
              data: datapoints
          }]
      }
    })
  }

  showProfile = () => {
    this.props.dispatch({ type: "SEARCH_EQUITY", payload: this.props.companyName.toLowerCase() })
  }

  trade = () => {
    this.setState({ showTradeForm: true })
  }

  closeTradeForm = () => {
    this.setState({ showTradeForm: false })
  }

  handleTrade = (e) => {
    this.setState({ [e.target.name]: e.target.value })
  }

  handleDirection = (e) => {
    if (e.target.value === "sell") {
      this.setState( prevState => {
        return { quantity: -prevState.quantity }
      })
    } else {
      this.setState( prevState => {
        return { quantity: Math.abs(prevState.quantity) }
      })
    }
  }

  addEquityId = (e) => {
    this.setState({ addEquityId: this.props.id, addDashboardId: e.target.value })
  }

  addToDashboard = () => {
    let data = {
      dashboard_id: parseInt(this.state.addDashboardId),
      equity_id: this.state.addEquityId
    }
    fetch(`${this.props.url}/api/v1/equity_dashboards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accepts": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then( json => {
      this.setState({
        addEquityId: 0,
        addDashboardId: 0,
        showTradeForm: false,
        addedToDashboard: true,
      })
    })
  }

  addToPortfolio = () => {
    let data = {
      portfolio_id: this.props.portfolio.id,
      equity_id: this.props.id,
      initial_px: parseFloat(this.state.currentPrice),
      date_bought: (new Date().getFullYear() + "-" + (new Date().getMonth()+1) + "-" + (new Date().getDate())),
      quantity: parseFloat(this.state.quantity),
      initial_value: parseFloat(Math.round(this.state.quantity * this.state.currentPrice * 100)/100)
    }

    fetch(`${this.props.url}/api/v1/subportfolios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accepts": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then( json => {
      this.props.dispatch({ type: "SET_PORTFOLIO_EQUITIES", payload: [...this.props.portfolioEquities, json] })
      this.updateAccountBalance(json.initial_value, json)
    })
  }

  /**********************************************
                  FETCH FUNCTIONS
  **********************************************/
  fetchFromDate(date) {
    fetch(`https://api.iextrading.com/1.0/stock/${this.props.ticker}/chart/date/${date}`)
    .then(res => res.json())
    .then( json => {
      this.setDatapoints(json)
    })
  }

  fetchPostCloseTradeData() {
    // fetch(`https://api.iextrading.com/1.0/stock/${this.props.ticker}/chart/1d`)
    fetch(`https://cloud.iexapis.com/stable/stock/${this.props.ticker}/intraday-prices?token=${this.props.api}`)
    .then(res => res.json())
    .then( json => {
      this.setDatapoints(json)
    })
  }

  fetchIntradayData() {
    fetch(`https://cloud.iexapis.com/stable/stock/${this.props.ticker}/intraday-prices?token=${this.props.api}`)
    .then(res => res.json())
    .then( json => {
      this.setDatapoints(json)
    })
  }

  fetchStatsData() {
    fetch(`https://cloud.iexapis.com/stable/stock/${this.props.ticker}/ohlc?token=${this.props.api}`)
    .then(res => res.json())
    .then( json => {
      // console.log(json.open.price)
      this.setState({
        stats: {
          open: json.open.price,
          close: json.close.price,
          high: json.high,
          low: json.low,
        }
      })
    })
  }

  fetchCurrentPrice = () => {
    // console.log("will fetch price?");
    fetch(`https://cloud.iexapis.com/stable/stock/${this.props.ticker}/price?token=${this.props.api}`)
    .then(this.handleErrors)
    .then(res => res.json())
    .then(json => {
      // debugger
      this.setState({ currentPrice: json })
    })
    .catch(error => console.log(error))
  }

  handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusTet);
    }
    return response;
  }

  updateAccountBalance = (value, newSubportfolio) => {
    let data ={
      account_balance: Math.round((parseFloat(this.props.portfolio.account_balance) - value - 5)*100)/100
    }

    fetch(`${this.props.url}/api/v1/portfolios/${this.props.portfolio.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accepts": "application/json"
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(json => {

      // let newPortfolioEquities = [...this.props.portfolioEquities, newSubportfolio]
      this.props.dispatch({ type: "SET_PORTFOLIO", payload: json })
      this.props.dispatch({ type: "SET_ACCOUNT_BALANCE", payload: data.account_balance })

    })
  }

  /**********************************************
                RENDER FUNCTIONS
  **********************************************/
  renderTradeForm(id) {
    let dashboardIds = this.props.dashboardEquities.map( e => e.id )
    let portfolioIds = this.props.portfolioEquities.map( e => e.id )

    return (
      <div className="modal">
        <div className="modal-content-sm">
          <button onClick={this.closeTradeForm} className="close">X</button>
          <h4>{this.props.ticker} - ${this.state.currentPrice}</h4>
          {
            dashboardIds.includes(id) || this.state.addedToDashboard ?
            null
            :
            <div className="modal-content-div">
              {
                this.props.dashboards.length === 1 ?
                <div>
                  <span> you currently don't have any dashboards! </span>
                  <br />
                  <br />
                  <NavLink
                    className="eq-navlink"
                    to="/dashboards/main">go to dashboards</NavLink>
                </div>
                :
                <Fragment>
                  <span> add to a dashboard </span>
                  <select onChange={this.addEquityId}>
                  {
                    this.props.dashboards.map( dashboard => {
                      if (dashboard.name === "main") {
                        return <option value="">Select</option>
                      } else {
                        return <option value={dashboard.id}>{dashboard.name}</option>
                      }
                    })
                  }
                  </select>
                  <button className="add-btn" onClick={this.addToDashboard}>+</button>
                </Fragment>
              }
              <br />
              <p> - - - - - - - - - - -  or  - - - - - - - - - - -</p>
            </div>
          }
          <div className="modal-content-div">
            <span> trading fee: $5 </span>
            <br />
            <span> cost of trade: ${ (Math.round(this.state.currentPrice * this.state.quantity * 100)/100 + 5).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
            <br />
            <span> account balance: ${this.props.accountBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} </span>
            <br />
            <br />
            <label> quantity </label>
            <input name="quantity" onChange={this.handleTrade} value={this.state.quantity} type="text" /><br />
            <br />
              <label> buy/sell </label>
              <select onChange={this.handleDirection} value={this.state.direction}>
                <option value="buy">buy</option>
                <option value="sell">sell</option>
              </select><br />
            <br />
              {
                isNaN(this.state.quantity) ?
                <span> please enter a valid number </span>
                :
                null
              }
              {
                (this.state.quantity * this.state.currentPrice + 5)> this.props.accountBalance ?
                <div>
                  <h5> you don't have anough in your account to cover this trade </h5>
                  <NavLink
                    className="eq-navlink"
                    to="/account">go to account</NavLink>
                </div>
                :
                <div>
                  <button className="search-btn" onClick={this.addToPortfolio}> trade </button>
                </div>
              }
              {
                this.state.quantity < 0 && !portfolioIds.includes(id) ?
                <h5> warning: you currently don't have this stock
                <br />
                in your portfolio, please proceed only if you
                <br />
                understand the risks of short-selling
               </h5>
                :
                null
              }
          </div>
        </div>
      </div>
    )
  }


  renderStats() {
    return (
      <div>
      <h5>current price: {this.state.currentPrice}</h5>
      <h5>
        open: {this.state.stats.open} |
        close: {this.state.stats.close} |
        high: {this.state.stats.high} |
        low: {this.state.stats.low}
      </h5>
      </div>
    )
  }

  renderDetails() {
    return (
      <div>
      <h5> average volume: {Math.round(this.props.details.avgTotalVolume/100000)/10}m |
          market cap: ${Math.round(this.props.details.marketCap/100000)/10}m </h5>
      <h5> previous close: ${this.props.details.previousClose} |
          52 week high: ${this.props.details.week52High} |
          52 week low: ${this.props.details.week52Low}</h5>
      </div>
    )
  }

  render() {
    return (
      <div className={this.props.class}>
        {
          !!this.props.trade && !!this.props.user_id ?
          <button className="trade-btn" onClick={this.trade}>trade</button>
          :
          null
        }
        {
          this.state.showTradeForm ?
          this.renderTradeForm(this.props.id)
          :
          null
        }
        {
          !!this.props.delete ?
          <button
            className="delete-btn"
            onClick={() => this.props.delete(this.props.ticker, this.props.id)}>X</button>
          :
          null
        }

        {
          this.props.showProfile ?
          <NavLink
            className="eq-navlink"
            activeStyle={{ background: "rgba(92, 151, 191, 1)", color: "white"}}
            onClick={this.showProfile}
            to={`/equities/search?=${this.props.companyName.toLowerCase()}`}>{this.props.ticker} - {this.props.companyName}</NavLink>
          :
          <Fragment>
          {
            this.props.companyName ?
            <h4>{this.props.ticker} - {this.props.companyName}</h4>
            :
            null
          }
          </Fragment>
        }

        {
          this.props.showProfile || this.props.delete ?
          <Fragment>
            <h5>{this.state.stats.sector} </h5>
          </Fragment>
          :
          null
        }

        <EquityChart
          ticker={this.props.ticker}
          data={this.state.data}
          legend={this.state.legend}
          options={this.state.options}
        />

        {
          this.props.noStats ?
          null
          :
          this.renderStats()
        }
        {
          this.props.details ?
          this.renderDetails()
          :
          null
        }

      </div>
    )
  }

} // end of Equity component

function mapStateToProps(state) {
  return {
    user_id: state.user_id,
    search: state.search,
    dashboards: state.dashboards,
    dashboardEquities: state.dashboardEquities,
    portfolio: state.portfolio,
    portfolioEquities: state.portfolioEquities,
    accountBalance: state.accountBalance,
    url: state.url,
    iex: state.iex,
    version: state.version,
    api: state.api
  }
}

const HOC = connect(mapStateToProps)

export default HOC(Equity);
