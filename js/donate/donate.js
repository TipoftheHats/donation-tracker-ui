import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cn from 'classnames';

import styles from './donate.css';

const IncentiveProps = PropTypes.shape({
  id: PropTypes.number.isRequired,
  parent: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    custom: PropTypes.bool.isRequired,
    description: PropTypes.string.isRequired,
  }),
  name: PropTypes.string.isRequired,
  runname: PropTypes.string.isRequired,
  amount: PropTypes.string.isRequired, // TODO: this and goal should be numbers but django seems to be serializing them as strings?
  count: PropTypes.number.isRequired,
  goal: PropTypes.string,
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
});

class Incentives extends React.PureComponent {
  static propTypes = {
    step: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    incentives: PropTypes.arrayOf(IncentiveProps.isRequired).isRequired,
    addIncentive: PropTypes.func.isRequired,
  };

  static defaultProps = {
    step: 0.01,
  };

  state = {
    search: 'c',
    amount: 0,
  };

  static getDerivedStateFromProps(props, state) {
    const addedState = {};
    if (state.selectedChoice) {
      addedState.newOption = false;
      addedState.newOptionValue = '';
    }
    if (state.newOption) {
      addedState.newOption = state.newOption;
      addedState.selectedChoice = null;
    } else {
      addedState.newOptionValue = '';
    }

    return addedState;
  }

  matchResults_() {
    const search = this.state.search.toLowerCase();
    return _.uniqBy(this.props.incentives.filter(i => {
      return (i.parent ? i.parent.name : i.name).toLowerCase().includes(search)
        || (i.runname && i.runname.toLowerCase().includes(search));
    }).map(i => ({
      id: i.id,
      run: i.runname,
      name: i.parent ? i.parent.name : i.name
    })), i => `${i.run}--${i.name}`)
      .slice(0, 7);
  }

  addIncentiveDisabled() {
    return this.state.amount <= 0 || this.state.amount > this.props.total;
  }

  addIncentive = (e) => {
    e.preventDefault();
    this.props.addIncentive({
      bid: (this.state.newOptionValue || !this.state.selectedChoice) ? this.state.selected.id : this.state.selectedChoice,
      amount: this.state.amount,
      customoptionname: this.state.newOptionValue,
    });
    this.setState({selected: null});
  };

  setChecked = key => {
    return e => {
      this.setState({[key]: e.target.checked});
    };
  };

  setValue = key => {
    return e => {
      this.setState({[key]: e.target.value});
    }
  };

  select = id => {
    return () => {
      if (this.props.total === 0) {
        return;
      }
      const result = this.props.incentives.find(i => i.id === id);
      this.setState({
        selected: {...(result.parent || result), runname: result.runname},
        choices: result.parent && this.props.incentives.filter(i => _.isEqual(i.parent, result.parent)),
        newOption: false,
        newOptionValue: '',
        selectedChoice: null,
        amount: 0,
      });
    };
  };

  render() {
    const {
      amount,
      choices,
      search,
      selected,
      newOption,
      newOptionValue,
      selectedChoice,
    } = this.state;
    const {
      step,
      total,
    } = this.props;
    return (
      <div className={styles['incentives']}>
        <div className={styles['left']}>
          <div className={styles['searches']}>
            <input className={styles['search']} value={search} onChange={this.setValue('search')} placeholder='filter'/>
            <div className={styles['results']}>
              {
                search ?
                  <React.Fragment>
                    {
                      this.matchResults_().map(result =>
                        <div className={styles['result']} key={result.id} onClick={this.select(result.id)}>
                          <div className={styles['resultRun']}>{result.run}</div>
                          <div className={styles['resultName']}>{result.name}</div>
                        </div>
                      )
                    }
                  </React.Fragment> :
                  null
              }
            </div>
          </div>
          <div className={styles['assigned']}>

          </div>
        </div>
        {selected ?
          <div className={styles['right']}>
            <div>{selected.runname}</div>
            <div>{selected.name}</div>
            <div>{selected.description}</div>
            {selected.custom ?
              <React.Fragment>
                <div>
                  <input checked={newOption} type='checkbox' onChange={this.setChecked('newOption')} name='custom'/>
                  <label htmlFor='custom'>Nominate a new option!</label>
                </div>
                <div>
                  <input value={newOptionValue} disabled={!newOption} name='newOptionValue'
                         onChange={this.setValue('newOptionValue')}/>
                </div>
              </React.Fragment> :
              null}
            {choices ?
              <React.Fragment>
                <div>Choose an existing option:</div>
                {choices.map(choice =>
                  (<div key={choice.id}>
                    <input checked={selectedChoice === choice.id} type='checkbox'
                           onChange={() => this.setState({selectedChoice: choice.id, newOption: false})}
                           name={`choice-${choice.id}`}/>
                    <label htmlFor={`choice-${choice.id}`}>{choice.name}</label>
                    <span style={{float: 'right'}}>${choice.total}</span>
                  </div>)
                )}
              </React.Fragment> :
              null}
            <div>Amount to put towards incentive:</div>
            <input value={amount} name='amount' type='number' step={step} min={0} max={total}
                   onChange={this.setValue('amount')}/>
            <div>
              <button disabled={this.addIncentiveDisabled()} onClick={this.addIncentive}>ADD</button>
            </div>
          </div> :
          null}
      </div>
    );
  }
}

class Donate extends React.PureComponent {
  static propTypes = {
    incentives: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
    }).isRequired).isRequired,
    initialIncentives: PropTypes.arrayOf(PropTypes.shape({
      bid: PropTypes.number.isRequired,
      amount: PropTypes.string.isRequired,
      customoptionname: PropTypes.string.isRequired,
    }).isRequired).isRequired,
    step: PropTypes.number.isRequired,
    minimumDonation: PropTypes.number.isRequired,
    maximumDonation: PropTypes.number.isRequired,
    showPrizes: PropTypes.bool.isRequired,
    donateUrl: PropTypes.string.isRequired,
    csrfToken: PropTypes.string,
  };

  static defaultProps = {
    step: 0.01,
    initialAskIncentives: false,
    initialShowIncentives: true,
    minimumDonation: 5,
    maximumDonation: 10000,
    showPrizes: true,
    initialIncentives: [],
  };

  state = {
    askIncentives: this.props.initialAskIncentives,
    showIncentives: this.props.initialShowIncentives,
    currentIncentives: this.props.initialIncentives,
    requestedalias: '',
    requestedemail: '',
    amount: 5,
  };

  setValue = key => {
    return e => {
      this.setState({[key]: e.target.value});
    }
  };

  setAmount = (amount) => {
    return e => {
      this.setState({amount});
      e.preventDefault();
    }
  };

  addIncentive_ = (incentive) => {
    this.setState({currentIncentives: this.state.currentIncentives.concat([incentive])});
  };

  componentWillMount() {
    this.bidsformmanagement = Array.from(document.querySelector('table[data-form=bidsform][data-form-type=management]').querySelectorAll('input')).filter(i => i.id);
    this.bidsformempty = Array.from(document.querySelector('table[data-form=bidsform][data-form-type=empty]').querySelectorAll('input')).filter(i => i.id);
    this.prizesform = Array.from(document.querySelector('table[data-form=prizesform]').querySelectorAll('input')).filter(i => i.id);
  }

  render() {
    const {
      askIncentives,
      showIncentives,
      currentIncentives,
      requestedalias,
      requestedemail,
      amount,
    } = this.state;
    const {
      step,
      minimumDonation,
      maximumDonation,
      showPrizes,
      donateUrl,
      incentives,
      csrfToken,
    } = this.props;
    return (
      <form className={styles['donationForm']} action={donateUrl} method='post'>
        <input type='hidden' name='csrfmiddlewaretoken' value={csrfToken}/>
        <div className={styles['donation']}>
          <div className={cn(styles['cubano'], styles['thankyou'])}>THANK YOU</div>
          <div className={cn(styles['cubano'], styles['fordonation'])}>FOR YOUR DONATION</div>
          <div>100% of your donation goes directly to {'{{CHARITY}}'}.</div>
          <div>
            <input type='hidden' name='requestedvisibility' value={requestedalias ? 'ALIAS' : 'ANON'}/>
            <input className={styles['preferredNameInput']} placeholder='Preferred Name/Alias' type='text'
                   name='requestedalias' value={requestedalias}
                   onChange={this.setValue('requestedalias')}/>
            <div>(Leave blank for Anonymous)</div>
          </div>
          <div>
            <input type='hidden' name='requestedsolicitemail' value='CURR'/>
            <input className={styles['preferredEmailInput']} placeholder='Email Address' type='email'
                   name='requestedemail' value={requestedemail}
                   onChange={this.setValue('requestedemail')}/>
            <div>(Click here for our privacy policy)</div>
          </div>
          <div className={styles['donationArea']}>
            <div className={styles['donationAmount']}>
              <input className={styles['amountInput']} placeholder='Enter Amount' type='number' name='amount'
                     value={amount} step={step} min={minimumDonation} max={maximumDonation}
                     onChange={this.setValue('amount')}/>
              <div className={styles['buttons']}>
                <button onClick={this.setAmount(25)}>$25</button>
                <button onClick={this.setAmount(50)}>$50</button>
                <button onClick={this.setAmount(75)}>$75</button>
              </div>
              <div className={styles['buttons']}>
                <button onClick={this.setAmount(100)}>$100</button>
                <button onClick={this.setAmount(250)}>$250</button>
                <button onClick={this.setAmount(500)}>$500</button>
              </div>
              <div>(Minimum donation is ${minimumDonation})</div>
            </div>
            {showPrizes ?
              <div className='prizeInfo'>
                <div>Donations can enter you to win prizes!</div>
                <div><a href='prizes.html'>Current prize list (New tab)</a></div>
                <div><a href='rules.html'>Official Rules (New tab)</a></div>
              </div> :
              null}
          </div>
          <div className='commentArea'>
            <div>(OPTIONAL) LEAVE A COMMENT?</div>
            <textarea className={styles['commentInput']} placeholder='Greetings from Germany!' type='textarea'
                      name='comment' maxLength={5000}/>
            <label htmlFor='comment'>Please refrain from offensive language or hurtful remarks. All donation comments
              are
              screened and will be removed from the website if deemed unacceptable.</label>
          </div>
        </div>
        {askIncentives ?
          <React.Fragment>
            <div>DONATION INCENTIVES</div>
            <div>Donation incentives can be used to add bonus runs to the schedule or influence choices by runners. Do
              you wish to put your donation towards an incentive?
            </div>
            <div>
              <button onClick={e => {
                e.preventDefault();
                this.setState({askIncentives: false, showIncentives: true});
              }}>
                YES!
              </button>
              <button onClick={e => {
                e.preventDefault();
                this.setState({askIncentives: false, showIncentives: false});
              }}>NO, SKIP INCENTIVES
              </button>
            </div>
          </React.Fragment>
          :
          <React.Fragment>
            {showIncentives ?
              <Incentives incentives={incentives} step={step} total={amount - currentIncentives.reduce((sum, ci) => sum + ci.amount, 0)} addIncentive={this.addIncentive_}/> :
              null
            }
            <button type='submit'>FINISH</button>
          </React.Fragment>
        }
        <React.Fragment>
          {this.bidsformmanagement.map(i => <input key={i.id} id={i.id} name={i.name} value={i.name.includes('TOTAL_FORMS') ? currentIncentives.length : i.value} type='hidden'/>)}
        </React.Fragment>
        <React.Fragment>
          {this.prizesform.map(i => <input key={i.id} id={i.id} name={i.name} value={i.value} type='hidden'/>)}
        </React.Fragment>
        <React.Fragment>
          {currentIncentives.map((ci, k) =>
            <React.Fragment key={ci.bid}>
              {this.bidsformempty.map(i =>
              <input
                key={i.name.replace('__prefix__', k)}
                id={i.id.replace('__prefix__', k)}
                name={i.name.replace('__prefix__', k)}
                type='hidden'
                value={ci[i.name.split('-').slice(-1)[0]]}
              />
            )}
              <div>Bid: {incentives.find(i => i.id === ci.bid).name}</div>
              <div>Amount: {ci.amount}</div>
              <div>New: {ci.customoptionname}</div>
            </React.Fragment>
          )}
        </React.Fragment>
      </form>
    );
  }
};

export default Donate;
