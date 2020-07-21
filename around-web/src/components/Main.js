import React, {Component} from 'react';
import Register from "./Register";
import Login from "./Login"
import { Switch, Route, Redirect } from 'react-router-dom';
import {Home} from './Home';

class Main extends Component {

    getLogin = () => {
        // two cases. 1. already logged in  2. not log in
        // 1. redirect to Home page
        // 2. go to log in page
        return this.props.isLoggedIn ? <Redirect to="/home" /> :
            <Login handleLoginSucceed={this.props.handleLoginSucceed}/>;
    }

    getHome = () => {
        return this.props.isLoggedIn ? <Home/> : <Redirect to="/login"/>;
    }


    render() {
        return (
            <div className="main">
                <Switch>
                    <Route path="/login" render={this.getLogin}/>
                    <Route path="/register" component={Register}/>
                    <Route path="/home" render={this.getHome}/>

                    <Route render={this.getLogin}/>
                </Switch>
            </div>
        );
    }
}

export default Main;