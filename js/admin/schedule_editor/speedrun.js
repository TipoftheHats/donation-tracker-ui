import _ from 'underscore';
import React from 'react';
const { PropTypes } = React;
import { DragSource } from 'react-dnd';
import moment from 'moment';

import Spinner from '../../public/spinner';
import OrderTarget from '../../public/order_target';
import FormField from '../../public/form_field';
import ErrorList from '../../public/error_list';

import SpeedrunDropTarget from './drag_drop/speedrun_drop_target';

class Speedrun extends React.Component {
    constructor(props) {
        super(props);
        this.nullOrder_ = this.nullOrder_.bind(this);
        this.editModel_ = this.editModel_.bind(this);
        this.cancelEdit_ = this.cancelEdit_.bind(this);
        this.updateField_ = this.updateField_.bind(this);
        this.legalMove_ = this.legalMove_.bind(this);
        this.save_ = this.save_.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(nextProps, this.props);
    }

    line() {
        const {
            speedrun,
            draft,
            connectDragPreview
        } = this.props;
        const fieldErrors = draft ? (draft._fields || {}) : {};
        const {
            cancelEdit_,
            editModel_,
            updateField_,
            save_,
        } = this;
        return draft ?
            [
            <td key='name'>
                {connectDragPreview(<div><FormField name='name' value={draft.name} modify={updateField_} /></div>)}
                <ErrorList errors={fieldErrors.name} />
            </td>,
            <td key='deprecated_runners'>
                <FormField name='deprecated_runners' value={draft.deprecated_runners} modify={updateField_} />
                <ErrorList errors={fieldErrors.deprecated_runners} />
            </td>,
            <td key='console'>
                <FormField name='console' value={draft.console} modify={updateField_} />
                <ErrorList errors={fieldErrors.console} />
            </td>,
            <td key='run_time'>
                <FormField name='run_time' value={draft.run_time} modify={updateField_} />
                <ErrorList errors={fieldErrors.run_time} />
            </td>,
            <td key='setup_time'>
                <FormField name='setup_time' value={draft.setup_time} modify={updateField_} />
                <ErrorList errors={fieldErrors.setup_time} />
            </td>,
            <td key='description'>
                <FormField name='description' value={draft.description} modify={updateField_} />
                <ErrorList errors={fieldErrors.description} />
            </td>,
            <td key='commentators'>
                <FormField name='commentators' value={draft.commentators} modify={updateField_} />
                <ErrorList errors={fieldErrors.commentators} />
            </td>,
            <td key='buttons'>
                <Spinner spinning={(speedrun._internal && speedrun._internal.saving) || false}>
                    <button type='button' value='Cancel' onClick={cancelEdit_}>Cancel</button>
                    <button type='button' value='Save' onClick={save_}>Save</button>
                </Spinner>
            </td>
            ]
            :
            [
            <td key='name'>
                {connectDragPreview(<input name='name' value={speedrun.name} readOnly={true} />)}
            </td>,
            <td key='deprecated_runners'>
                <input name='deprecated_runners' value={speedrun.deprecated_runners} readOnly={true} />
            </td>,
            <td key='console'>
                <input name='console' value={speedrun.console} readOnly={true} />
            </td>,
            <td key='run_time'>
                <input name='run_time' value={speedrun.run_time} readOnly={true} />
            </td>,
            <td key='setup_time'>
                <input name='setup_time' value={speedrun.setup_time} readOnly={true} />
            </td>,
            <td key='description'>
                <input name='description' value={speedrun.description} readOnly={true} />
            </td>,
            <td key='commentators'>
                <input name='commentators' value={speedrun.commentators} readOnly={true} />
            </td>,
            <td key='buttons'>
                <button type='button' value='Edit' onClick={editModel_}>Edit</button>
            </td>
            ];
    }

    render() {
        const {
            speedrun,
            isDragging,
            moveSpeedrun,
            connectDragSource,
        } = this.props;
        const {
            legalMove_,
            nullOrder_,
        } = this;
        return (
            <tr style={{opacity: isDragging ? 0.5 : 1}}>
                <td className='small'>
                    {(speedrun && speedrun.order !== null && speedrun.starttime !== null) ? moment(speedrun.starttime).format("dddd, MMMM Do, h:mm a") : 'Unscheduled' }
                </td>
                <td style={{textAlign: 'center'}}>
                    <OrderTarget
                        spinning={(speedrun._internal && (speedrun._internal.moving || speedrun._internal.saving)) || false}
                        connectDragSource={connectDragSource}
                        nullOrder={nullOrder_}
                        target={!!speedrun.order}
                        targetType={SpeedrunDropTarget}
                        targetProps={{
                            pk: speedrun.pk,
                            legalMove: legalMove_,
                            moveSpeedrun: moveSpeedrun,
                        }}
                        />
                </td>
                {this.line()}
            </tr>
        );
    }

    getChanges() {
        return _.pick(
            _.pick(this.props.draft, (value, key) => {
                return value !== (this.props.speedrun ? this.props.speedrun[key] : '');
            }),
            ['name', 'deprecated_runners', 'console', 'run_time', 'setup_time', 'description', 'commentators']
        );
    }

    legalMove_(source_pk) {
        return source_pk && this.props.speedrun.pk !== source_pk;
    }

    editModel_() {
        this.props.editModel(this.props.speedrun);
    }

    updateField_(field, value) {
        this.props.updateField(this.props.speedrun.pk, field, value);
    }

    nullOrder_() {
        this.props.saveField(this.props.speedrun, 'order', null);
    }

    cancelEdit_() {
        this.props.cancelEdit(this.props.draft);
    }

    save_() {
        const params = this.getChanges();
        if (Object.keys(params).length) {
            this.props.saveModel(this.props.speedrun.pk, params);
        }
    }
}

const SpeedrunShape = PropTypes.shape({
    pk: PropTypes.number,
    name: PropTypes.string.isRequired,
    order: PropTypes.number,
    deprecated_runners: PropTypes.string.isRequired,
    //console: PropTypes.string.isRequired,
    start_time: PropTypes.string,
    end_time: PropTypes.string,
    description: PropTypes.string.isRequired,
    commentators: PropTypes.string.isRequired,
});

Speedrun.propTypes = {
    connectDragSource: PropTypes.func.isRequired,
    connectDragPreview: PropTypes.func.isRequired,
    isDragging: PropTypes.bool.isRequired,
    speedrun: SpeedrunShape.isRequired,
    draft: SpeedrunShape,
    moveSpeedrun: PropTypes.func,
    saveField: PropTypes.func,
    saveModel: PropTypes.func.isRequired,
    cancelEdit: PropTypes.func.isRequired,
    editModel: PropTypes.func.isRequired,
};

const speedrunSource = {
    beginDrag: function(props) {
        return {source_pk: props.speedrun.pk};
    },

    endDrag: function(props, monitor) {
        const result = monitor.getDropResult();
        if (result && result.action) {
            result.action(props.speedrun.pk);
        }
    },
};

Speedrun = DragSource('Speedrun', speedrunSource, function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    }
})(Speedrun);

export default Speedrun;
