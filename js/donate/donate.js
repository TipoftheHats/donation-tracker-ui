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
    search: '',
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
    let {incentives} = this.props;
    if (search) {
      incentives = incentives.filter(i => {
        return (i.parent ? i.parent.name : i.name).toLowerCase().includes(search)
          || (i.runname && i.runname.toLowerCase().includes(search));
      });
    }
    incentives = incentives.map(i => ({
      id: i.id,
      run: i.runname,
      name: i.parent ? i.parent.name : i.name
    }));
    return _.uniqBy(incentives, i => `${i.run}--${i.name}`);
  }

  addIncentiveDisabled_() {
    if (this.state.amount <= 0) {
      return 'Amount must be greater than 0.';
    } else if (this.state.amount > this.props.total) {
      return `Amount cannot be greater than $${this.props.total}.`;
    }
    return null;
  }

  addIncentive = (e) => {
    e.preventDefault();
    this.props.addIncentive({
      bid: (this.state.newOptionValue || !this.state.selectedChoice) ? this.state.selected.id : this.state.selectedChoice,
      amount: parseFloat(this.state.amount),
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
      const {
        total,
        incentives,
      } = this.props;
      if (total === 0) {
        return;
      }
      const result = incentives.find(i => i.id === id);
      this.setState({
        selected: {...(result.parent || result), runname: result.runname},
        choices: result.parent ? incentives.filter(i => i.parent && i.parent.id === result.parent.id) : incentives.filter(i => i.parent && i.parent.id === result.id),
        newOption: false,
        newOptionValue: '',
        selectedChoice: null,
        amount: total,
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
    const addIncentiveDisabled = this.addIncentiveDisabled_();
    return (
      <div className={styles['incentives']}>
        <div className={styles['left']}>
          <div className={styles['searches']}>
            <input className={styles['search']} value={search} onChange={this.setValue('search')} placeholder='Filter Results'/>
            <div className={styles['results']}>
              {
                this.matchResults_().map(result =>
                  <div className={styles['result']} key={result.id} onClick={this.select(result.id)}>
                    <div className={styles['resultRun']}>{result.run}</div>
                    <div className={styles['resultName']}>{result.name}</div>
                  </div>
                )
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
                    <span style={{float: 'right'}}>${choice.amount}</span>
                  </div>)
                )}
              </React.Fragment> :
              null}
            <div>Amount to put towards incentive:</div>
            <input value={amount} name='new_amount' type='number' step={step} min={0} max={total}
                   onChange={this.setValue('amount')} placeholder='Enter Here'/>
            <label htmlFor='new_amount'>You have ${total} remaining.</label>
            <div>
              <button className={styles['inverse']} id='add' disabled={addIncentiveDisabled}
                      onClick={this.addIncentive}>ADD
              </button>
              {addIncentiveDisabled && <label htmlFor='add' className='error'>{addIncentiveDisabled}</label>}
            </div>
          </div> :
          <div>You have ${total} remaining.</div>}
      </div>
    );
  }
}

class Donate extends React.PureComponent {
  static propTypes = {
    incentives: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
    }).isRequired).isRequired,
    formErrors: PropTypes.shape({
      bidsform: PropTypes.array.isRequired,
      commentform: PropTypes.object.isRequired,
    }).isRequired,
    initialForm: PropTypes.shape({
      requestedalias: PropTypes.string,
      requestedemail: PropTypes.string,
      amount: PropTypes.string,
    }).isRequired,
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
    prizesUrl: PropTypes.string.isRequired,
    rulesUrl: PropTypes.string,
    csrfToken: PropTypes.string,
  };

  static defaultProps = {
    step: 0.01,
    minimumDonation: 5,
    maximumDonation: 10000,
    showPrizes: true,
    initialIncentives: [],
  };

  state = {
    askIncentives: this.props.initialIncentives.length === 0,
    showIncentives: this.props.initialIncentives.length !== 0,
    currentIncentives: this.props.initialIncentives,
    requestedalias: this.props.initialForm.requestedalias || '',
    requestedemail: this.props.initialForm.requestedemail || '',
    requestedsolicitemail: this.props.initialForm.requestedsolicitemail || 'CURR',
    amount: this.props.initialForm.amount || '5',
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

  setEmail = (requestedsolicitemail) => {
    return e => {
      this.setState({requestedsolicitemail});
      e.preventDefault();
    }
  };

  addIncentive_ = (incentive) => {
    const {
      currentIncentives,
    } = this.state;
    const existing = currentIncentives.findIndex(ci => ci.bid === incentive.bid);
    let newIncentives;
    if (existing !== -1) {
      incentive.amount += parseFloat(currentIncentives[existing].amount);
      newIncentives = currentIncentives.slice(0, existing).concat([incentive]).concat(currentIncentives.slice(existing + 1));
    } else {
      newIncentives = currentIncentives.concat([incentive]);
    }
    this.setState({currentIncentives: newIncentives});
  };

  deleteIncentive_ = (i) => {
    return e => {
      const {
        currentIncentives,
      } = this.state;
      this.setState({currentIncentives: currentIncentives.slice(0, i).concat(currentIncentives.slice(i + 1))});
    }
  };

  sumIncentives_() {
    return this.state.currentIncentives.reduce((sum, ci) => sum + parseFloat(ci.amount), 0);
  }

  finishDisabled_() {
    const {
      amount,
      currentIncentives,
    } = this.state;
    const {
      incentives,
    } = this.props;
    if (this.sumIncentives_() > amount) {
      return 'Total bid amount cannot exceed donation amount.';
    }
    if (currentIncentives.some(ci => !incentives.find(i => i.id === ci.bid))) {
      return 'At least one incentive is no longer valid.';
    }
    if (currentIncentives.length > 10) {
      return 'Too many incentives.';
    }
    return null;
  }

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
      requestedsolicitemail,
      amount,
    } = this.state;
    const {
      step,
      event,
      prizesUrl,
      rulesUrl,
      minimumDonation,
      maximumDonation,
      formErrors,
      showPrizes,
      donateUrl,
      incentives,
      csrfToken,
    } = this.props;
    // TODO: show more form errors
    const finishDisabled = this.finishDisabled_();
    return (
      <form className={styles['donationForm']} action={donateUrl} method='post'>
        <input type='hidden' name='csrfmiddlewaretoken' value={csrfToken}/>
        <div className={styles['donation']}>
          <div className={cn(styles['cubano'], styles['thankyou'])}>THANK YOU</div>
          <div className={cn(styles['cubano'], styles['fordonation'])}>FOR YOUR DONATION</div>
          <div>100% of your donation goes directly to {event.receivername}.</div>
          <div>
            <input type='hidden' name='requestedvisibility' value={requestedalias ? 'ALIAS' : 'ANON'}/>
            <input className={styles['preferredNameInput']} placeholder='Preferred Name/Alias' type='text'
                   name='requestedalias' value={requestedalias}
                   onChange={this.setValue('requestedalias')}/>
            <div>(Leave blank for Anonymous)</div>
          </div>
          <div>
            <input className={styles['preferredEmailInput']} placeholder='Email Address' type='email'
                   name='requestedemail' value={requestedemail}
                   onChange={this.setValue('requestedemail')}/>
            <div>(Click here for our privacy policy)</div>
          </div>
          <div>
            Do you want to receive emails from {event.receivername}?
          </div>
          <div>
            <input type='hidden' name='requestedsolicitemail' value={requestedsolicitemail}/>
            <button className={cn({[styles['selected']]: requestedsolicitemail === 'YES'})}
                    disabled={requestedsolicitemail === 'YES'} onClick={this.setEmail('YES')}>Yes
            </button>
            <button className={cn({[styles['selected']]: requestedsolicitemail === 'NO'})}
                    disabled={requestedsolicitemail === 'NO'} onClick={this.setEmail('NO')}>No
            </button>
            <button className={cn({[styles['selected']]: requestedsolicitemail === 'CURR'})}
                    disabled={requestedsolicitemail === 'CURR'} onClick={this.setEmail('CURR')}>Use Existing Preference
              (No if not already set)
            </button>
          </div>
          <div className={styles['donationArea']}>
            <div className={styles['donationAmount']}>
              <input className={styles['amountInput']} placeholder='Enter Amount' type='number' name='amount'
                     value={amount} step={step} min={event.minimumdonation} max={maximumDonation}
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
                <div><a href={prizesUrl}>Current prize list (New tab)</a></div>
                {rulesUrl ? <div><a href={rulesUrl}>Official Rules (New tab)</a></div> : null}
              </div> :
              null}
          </div>
          <div className='commentArea'>
            <div>(OPTIONAL) LEAVE A COMMENT?</div>
            <textarea className={styles['commentInput']} placeholder='Greetings from Germany!'
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
              <button className={styles['inverse']} onClick={e => {
                e.preventDefault();
                this.setState({askIncentives: false, showIncentives: true});
              }}>
                YES!
              </button>
              <button className={styles['inverse']} onClick={e => {
                e.preventDefault();
                this.setState({askIncentives: false, showIncentives: false});
              }}>NO, SKIP INCENTIVES
              </button>
            </div>
          </React.Fragment>
          :
          <React.Fragment>
            {showIncentives ?
              <Incentives errors={formErrors.bidsform} incentives={incentives} step={step}
                          total={amount - this.sumIncentives_()} addIncentive={this.addIncentive_}/> :
              null
            }
            <button className={styles['inverse']} id='finish' disabled={this.finishDisabled_()} type='submit'>FINISH
            </button>
            {finishDisabled && <label htmlFor='finish' className='error'>{finishDisabled}</label>}
          </React.Fragment>
        }
        <React.Fragment>
          {this.bidsformmanagement.map(i => <input key={i.id} id={i.id} name={i.name}
                                                   value={i.name.includes('TOTAL_FORMS') ? currentIncentives.length : i.value}
                                                   type='hidden'/>)}
        </React.Fragment>
        <React.Fragment>
          {this.prizesform.map(i => <input key={i.id} id={i.id} name={i.name} value={i.value} type='hidden'/>)}
        </React.Fragment>
        <React.Fragment>
          {currentIncentives.map((ci, k) =>
            <div key={ci.bid} onClick={this.deleteIncentive_(k)}>
              {this.bidsformempty.map(i =>
                <input
                  key={i.name.replace('__prefix__', k)}
                  id={i.id.replace('__prefix__', k)}
                  name={i.name.replace('__prefix__', k)}
                  type='hidden'
                  value={ci[i.name.split('-').slice(-1)[0]]}
                />
              )}
              <div>Bid: {incentives.find(i => i.id === ci.bid) ? incentives.find(i => i.id === ci.bid).name : formErrors.bidsform[k].bid}</div>
              <div>Amount: {ci.amount}</div>
              <div>New: {ci.customoptionname}</div>
            </div>
          )}
        </React.Fragment>
      </form>
    );
  }
};

export default Donate;
