import { What } from '../core/What.js';


export class RemoteCall extends What {
    
    constructor(url, initParams = {}, emitter = undefined) {
        super();
        this._url = url instanceof URL? url: new URL(url);
        this._initParams = initParams;
        this._emitter = emitter;
    }

    /**
     * A URL instance
     */
    get url() {
        return this._url;
    }

    get initParams() {
        return this._initParams;
    }

    get emitter() {
        return this._emitter
    }

    /**
     * Sets a key=value pair in the searchParams of this.url
     * @param {*} key 
     * @param {*} value 
     * @returns {RemoteCall} - this for concatenation
     */
    letQuery(key, value) {
        this.url.searchParams.set(key, value)
        return this
    }

    /**
     * Sets a key=value pair in the initParams of this RemoteCall
     * @param {*} key 
     * @param {*} value 
     * @returns {RemoteCall} - this for concatenation
     */
    letParam(key, value) {
        this.initParams[key] = value;
        return this;
    }

    letBody(data) {
        return this.letParam('body', data)
    }

    letHeader(key, value) {
        if(!this.initParams.headers) {
            this.initParams.headers = {}
        }
        this.initParams.headers[key] = value
        return this
    }

    async what() {
        
        if (this.emitter) {
            this.emitter.emit('request', this);
        }

        const response = await fetch(this.url, this.initParams);

        if(response.ok) {

            if (this.emitter) {
                this.emitter.emit('response', response, this);
            }

            return response

        } else {
            const errorData = await response.json();
            throw new Error(`HTTP Error: ${response.status}, ${errorData.message}`);
        }

    }

}
