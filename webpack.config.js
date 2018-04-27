const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const common = {
    mode: 'development',
    module: {
        rules: [{
            test: /\.js$/,
            include: [
                path.resolve(__dirname, 'src'),
                path.resolve(__dirname, 'test')
            ],
            exclude: /node_modules/,
            use: ['babel-loader']
        }, {test: /\.(woff2?|svg)$/, loader: 'url-loader?limit=10000'},
            {test: /\.(ttf|eot)$/, loader: 'file-loader'},
            {test: /\.css$/, use: ['style-loader', 'css-loader']},
            {
                test: /\.html$/,
                include: path.join(__dirname, 'web'),
                use: ['html-loader']
            }
        ]
    },

    resolve: {
        modules: [
            "node_modules",
            path.resolve('./src'),
            path.resolve('./web')
        ]
    },
    devServer: {
        contentBase: "./dist",
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    }
};

const frontend = {
    entry: ['./src/frontend.js'],

    plugins: [
        new CopyWebpackPlugin([{
            from: path.resolve('./web')
        }]),
        new webpack.ProvidePlugin({
                                      $: 'jquery',
                                      jQuery: 'jquery',
                                      Popper: ['popper.js', 'default'],
                                  })
    ],

    output: {
        filename: 'frontend.js',
        path: __dirname + '/dist'
    }
};

const fs = require('fs');
const nodeModules = {};

fs.readdirSync(path.resolve(__dirname, 'node_modules'))
  .filter(x => ['.bin'].indexOf(x) === -1)
  .forEach(mod => { nodeModules[mod] = `commonjs ${mod}`; });

const backend = {
    entry: {
        backend: ['./src/backend.js']
    },

    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },
    externals: nodeModules,
    output: {
        filename: 'backend.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new webpack.ProvidePlugin({
                                      $: 'jquery',
                                      jQuery: 'jquery',
                                      koa: 'koa'
                                  })
    ]
};

module.exports = [
    Object.assign({}, common, frontend),
    Object.assign({}, common, backend)
];