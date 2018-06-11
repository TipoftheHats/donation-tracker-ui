import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import cn from 'classnames';

import styles from './donate.css';

class Incentives extends React.PureComponent {
  static propTypes = {
    step: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    incentives: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
    })).isRequired,
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

  }

  addIncentive = (e) => {
    e.preventDefault();
    this.props.addIncentive({
      id: this.state.newOptionValue ? this.state.selected.id : this.state.selectedChoice,
      amount: this.state.amount,
      newOption: this.state.newOptionValue,
    });
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
            <input value={amount} name='amount' type='number' step={step} max={total} onChange={this.setValue('amount')} />
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
    step: PropTypes.number.isRequired,
    minimumDonation: PropTypes.number.isRequired,
    maximumDonation: PropTypes.number.isRequired,
    showPrizes: PropTypes.bool.isRequired,
    donateUrl: PropTypes.string.isRequired,
  };

  static defaultProps = {
    step: 0.01,
    minimumDonation: 5,
    maximumDonation: 10000,
    showPrizes: true,
  };

  state = {
    askIncentives: false,
    showIncentives: true,
    currentIncentives: [],
    preferredName: '',
    preferredEmail: '',
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
    console.log(incentive);
  };

  render() {
    const {
      askIncentives,
      showIncentives,
      preferredName,
      preferredEmail,
      amount,
    } = this.state;
    const {
      step,
      minimumDonation,
      maximumDonation,
      showPrizes,
      donateUrl,
      incentives,
    } = this.props;
    return (
      <form className={styles['donationForm']} action={donateUrl} method='post'>
        <div className={styles['donation']}>
          <div className={cn(styles['cubano'], styles['thankyou'])}>THANK YOU</div>
          <div className={cn(styles['cubano'], styles['fordonation'])}>FOR YOUR DONATION</div>
          <div>100% of your donation goes directly to {'{{CHARITY}}'}.</div>
          <div>
            <input className={styles['preferredNameInput']} placeholder='Preferred Name/Alias' type='text'
                   name='requestedalias' value={preferredName}
                   onChange={this.setValue('preferredName')}/>
            <div>(Leave blank for Anonymous)</div>
          </div>
          <div>
            <input className={styles['preferredEmailInput']} placeholder='Email Address' type='email'
                   name='requestedemail' value={preferredEmail}
                   onChange={this.setValue('preferredEmail')}/>
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
              <Incentives incentives={incentives} step={step} total={amount} addIncentive={() => {}} /> :
              null
            }
            <button type='submit'>FINISH</button>
          </React.Fragment>
        }
      </form>
    );
  }
};

export default Donate;
