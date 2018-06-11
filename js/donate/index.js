import React from 'react';
import ReactDOM from 'react-dom';

import Donate from './donate';

window.DonateApp = function(props) {
  ReactDOM.render(
    <Donate
      {...props}
      csrfToken={window.csrfToken}
    />,
    document.getElementById('container')
  );
}

