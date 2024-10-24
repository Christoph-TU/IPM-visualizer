const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: './',
        clean: true,
    },
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom/test-utils': 'preact/test-utils',
            'react-dom': 'preact/compat',
            'react/jsx-runtime': 'preact/jsx-runtime',
            '/src': path.resolve(__dirname, 'src'),
        },
        extensions: ['.js', '.jsx'],
        modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                        },
                    },
                ],
            },
            {
                test: /parserWorker\.js$/,
                use: [
                    {
                        loader: 'worker-loader',
                        options: { inline: 'no-fallback' },
                    },
                ],
            },
            // CSS Loader
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            // Image and Font Loader
            {
                test: /\.(png|jpg|gif|svg)$/,
                type: 'asset/inline', // Inline PNG images as Data URLs
            },
            // HTML Loader
            {
                test: /\.html$/,
                use: ['html-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html', // Updated to use html-loader
            inject: 'body',
        }),
        new HtmlInlineScriptPlugin(),
    ],
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false, // Do not generate a separate license file
            }),
        ],
    },
};
