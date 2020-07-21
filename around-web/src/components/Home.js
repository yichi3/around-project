import React, {Component} from 'react';
import Gallery from "./Gallery";
import CreatePostButton from './CreatePostButton';
import AroundMap from "./AroundMap";
import {Tabs, Spin, Row, Col, Radio} from 'antd';
import {
    GEO_OPTIONS,
    POS_KEY,
    API_ROOT,
    AUTH_HEADER,
    TOKEN_KEY,
    POST_TYPE_IMAGE,
    POST_TYPE_VIDEO,
    POST_TYPE_UNKNOWN,
    TOPIC_AROUND,
    TOPIC_FACE,
} from '../constants';


const {TabPane} = Tabs;

export class Home extends Component {
    state = {
        isLoadingGeoLocation: false,
        isLoadingPosts: false,
        error: '',
        posts: [],
        topic: TOPIC_AROUND
    }

    componentDidMount() {
        // fetch geo_location
        // console.log(navigator.geolocation);
        if ("geolocation" in navigator) {
            this.setState({isLoadingGeoLocation: true, error: ''});
            navigator.geolocation.getCurrentPosition(
                this.onSuccessLoadGeoLocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS,
            );
        } else {
            this.setState({error: 'Geolocation is not supported.'});
        }
    }

    onSuccessLoadGeoLocation = (position) => {
        // console.log(position);
        const {latitude, longitude} = position.coords;
        // let latitude = 37.45;
        // let longitude = -121.9;
        localStorage.setItem(POS_KEY, JSON.stringify({lat: latitude, lon: longitude}));
        this.setState({isLoadingGeoLocation: false, error: ''});
        this.loadNearbyPosts();
    }

    onFailedLoadGeoLocation = (err) => {
        console.log(err);
        this.setState({isLoadingGeoLocation: false, error: 'Failed to load geo location.'});
    }

    loadNearbyPosts = (center, radius) => {
        const { lat, lon } = center ? center : JSON.parse(localStorage.getItem(POS_KEY));
        // const { lat, lon } = center ? center : {lat: 37.4, lon: -122.0};
        // const lat = 37.4;
        // const lon = -122.0;
        console.log(lat, lon);
        const range = radius ? radius : 20;
        const token = localStorage.getItem(TOKEN_KEY);
        this.setState({isLoadingPosts: true, error: ''});
        return fetch(`${API_ROOT}/search?lat=${lat}&lon=${lon}&range=${range}`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error(response.statusText);
            })
            .then(data => {
                console.log(data);
                this.setState({
                    posts: data ? data : [],
                    isLoadingPosts: false,
                })
            })
            .catch((e) => {
                console.error(e);
                this.setState({isLoadingPosts: false, error: e.message});
            });
    }

    renderPosts = (type) => {
        const {isLoadingGeoLocation, isLoadingPosts, error, posts} = this.state;
        // case 1: if error
        if (error) {
            return error;
        }
        // case 2: if loading geolocation, use Spin in antd
        else if (isLoadingGeoLocation) {
            return <Spin tip="Loading GEO Location..."/>
        }
        // case 3: if loading posts
        else if (isLoadingPosts) {
            return <Spin tip="Loading posts..."/>
        }
        // case 4: render posts
        else if (posts.length > 0) {
            // case 1: image post
            // case 2: image video
            return type === POST_TYPE_IMAGE ? this.renderImagePosts() : this.renderVideoPosts();
        }
        // case 5: no data
        return 'No nearby posts';
    }

    renderImagePosts() {
        const {posts} = this.state;
        const images = posts
            .filter((post) => post.type === POST_TYPE_IMAGE)
            .map((post) => {
                return {
                    user: post.user,
                    src: post.url,
                    thumbnail: post.url,
                    caption: post.message,
                    thumbnailWidth: 400,
                    thumbnailHeight: 300,
                };
            });
        return <Gallery images={images}/>
    }

    renderVideoPosts() {
        const { posts } = this.state;
        return (
            <Row gutter={30}>
                {
                    posts
                        .filter((post) => [POST_TYPE_VIDEO, POST_TYPE_UNKNOWN].includes(post.type))
                        .map((post) => (
                            <Col span={6} key={post.url}>
                                <video src={post.url} controls={true} className="video-block"/>
                                <p>{post.user}: {post.message}</p>
                            </Col>
                        ))
                }
            </Row>
        );
    }

    handleTopicChange = (e) => {
        const topic = e.target.value;
        this.setState({ topic });
        if (topic === TOPIC_AROUND) {
            this.loadNearbyPosts();
        } else {
            this.loadFacesAroundTheWolrd();
        }
    }

    loadFacesAroundTheWolrd = () => {
        const token = localStorage.getItem(TOKEN_KEY);
        this.setState({ isLoadingPosts: true, error: '' });
        return fetch(`${API_ROOT}/cluster?term=face`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`,
            }
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to load posts');
            })
            .then((data) => {
                console.log(data);
                this.setState({ posts: data ? data : [], isLoadingPosts: false });
            })
            .catch((e) => {
                console.error(e);
                this.setState({ isLoadingPosts: false , error: e.message });
            });
    }

    loadPostsByTopic = (center, radius) => {
        if (this.state.topic === TOPIC_AROUND) {
            return this.loadNearbyPosts(center, radius);
        } else {
            return this.loadFacesAroundTheWolrd();
        }
    }


    render() {
        const operations = <CreatePostButton loadNearbyPosts={this.loadPostsByTopic}/>;
        return (
            <div>
                <Radio.Group onChange={this.handleTopicChange} value={this.state.topic}>
                    <Radio value={TOPIC_AROUND}>Posts Around Me</Radio>
                    <Radio value={TOPIC_FACE}>Faces Around The World</Radio>
                </Radio.Group>
                <Tabs tabBarExtraContent={operations} className="main-tabs">
                    <TabPane tab="Image Posts" key="1">
                        {this.renderPosts(POST_TYPE_IMAGE)}
                    </TabPane>
                    <TabPane tab="Video Posts" key="2">
                        {this.renderPosts(POST_TYPE_VIDEO)}
                    </TabPane>
                    <TabPane tab="Map" key="3">
                        <AroundMap
                            googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyD3CEh9DXuyjozqptVB5LA-dN7MxWWkr9s&v=3.exp&libraries=geometry,drawing,places"
                            loadingElement={<div style={{ height: `100%` }} />}
                            containerElement={<div style={{ height: `600px` }} />}
                            mapElement={<div style={{ height: `100%` }} />}
                            posts={this.state.posts}
                            loadPostsByTopic={this.loadPostsByTopic}
                        />
                    </TabPane>
                </Tabs>
            </div>

        );
    }
}
