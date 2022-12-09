import React, {Component} from 'react';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import * as Session from '../libs/actions/Session';
import FullScreenLoadingIndicator from '../components/FullscreenLoadingIndicator';

const propTypes = {
    /** The parameters needed to authenticate with a short lived token are in the URL */
    route: PropTypes.shape({
        /** Each parameter passed via the URL */
        params: PropTypes.shape({
            /** Short lived token to sign in a user */
            shortLivedToken: PropTypes.string,
        }),
    }).isRequired,
};

class LogInWithShortLivedTokenPage extends Component {
    componentDidMount() {
        const shortLivedToken = lodashGet(this.props, 'route.params.shortLivedToken', '');
        Session.createTemporaryLogin(shortLivedToken);
    }

    render() {
        return <FullScreenLoadingIndicator />;
    }
}

LogInWithShortLivedTokenPage.propTypes = propTypes;

export default LogInWithShortLivedTokenPage;
