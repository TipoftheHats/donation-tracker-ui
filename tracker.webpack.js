const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const sharedConfig = require('./shared.webpack')();
const WebpackManifestPlugin = require('webpack-yam-plugin');
const _ = require('lodash');


const PROD = process.env.NODE_ENV === 'production';

module.exports = {
  context: __dirname,
  entry: {
    admin: ['./js/init', './js/admin'],
    donate: ['./js/init', './js/donate'],
  },
  output: {
    'filename': PROD ? 'tracker-[name]-[hash].js' : 'tracker-[name].js',
    'pathinfo': true,
    'path': __dirname + '/static/gen',
    'publicPath': '/static/gen',
  },
  module: sharedConfig.module,
  plugins: _.compact([
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new WebpackManifestPlugin({
      manifestPath: __dirname + '/ui-tracker.manifest.json',
      outputRoot: __dirname + '/static'
    }),
    new ExtractTextPlugin(PROD ? 'tracker-[name]-[contenthash].css' : 'tracker-[name].css', {allChunks: true}),
    new webpack.DefinePlugin({
      __DEVTOOLS__: !PROD,
    }),
    PROD && new webpack.optimize.UglifyJsPlugin({comments: false}),
  ]),
  devServer: PROD ? null : sharedConfig.devServer,
  resolve: sharedConfig.resolve,
  devtool: PROD ? 'source-map' : 'eval-source-map',
};
