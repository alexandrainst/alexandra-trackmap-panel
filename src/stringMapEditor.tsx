import { FieldConfigEditorProps, StringFieldConfigSettings } from '@grafana/data';
import React from 'react';
import { Button, getTheme, Icon, Input } from '@grafana/ui';
import { getStyles } from './colorMapEditor';

export interface KeyValue {
  key: string;
  value: string;
}

interface StringMapEditorState {
  showAdd: boolean;
}

type StringMapEditorProps = FieldConfigEditorProps<KeyValue[], StringFieldConfigSettings>;

export default class StringMapEditor extends React.PureComponent<StringMapEditorProps, StringMapEditorState> {
  state: StringMapEditorState = {
    showAdd: false,
  };

  onRemoveKey = (index: number) => {
    let { value, onChange } = this.props;
    if (!value) {
      value = [];
    }
    const copy = [...value];
    copy.splice(index, 1);
    onChange(copy);
  };

  onValueChange = (key: string, stringValue: string, idx: number, e?: React.SyntheticEvent) => {
    if (e) {
      const evt = e as React.KeyboardEvent<HTMLInputElement>;
      if (e.hasOwnProperty('key')) {
        if (evt.key !== 'Enter') {
          return;
        }
      }
    }
    let { value, onChange } = this.props;

    if (!value) {
      value = [];
    }
    // Form event, or Enter
    if (idx < 0) {
      if (key) {
        if (e) {
          const evt = e as React.KeyboardEvent<HTMLInputElement>;
          evt.currentTarget.value = ''; // reset last value
        }
        onChange([...value, { key: key, value: stringValue }]);
      }
      this.setState({ showAdd: false });
      return;
    }

    if (!key) {
      return this.onRemoveKey(idx);
    }

    const copy = [...value];
    copy[idx] = { key: key, value: stringValue };
    onChange(copy);
  };

  render() {
    let { value, item } = this.props;
    const { showAdd } = this.state;
    const styles = getStyles(getTheme());
    let inputs = null;
    if (value) {
      inputs = value.map((k, index) => {
        const prefix = (
          <div className={styles.inputPrefix}>
            <Input
              // This is the HTML data
              style={{}}
              className={styles.textInput}
              key={`${index}/${k}`}
              defaultValue={k.value || '<div></div>'}
              onBlur={(e) => {
                this.onValueChange(k.key, e.currentTarget.value.trim(), index, e);
              }}
              onKeyDown={(e) => {
                this.onValueChange(k.key, e.currentTarget.value.trim(), index, e);
              }}
            />
          </div>
        );
        return (
          <Input
            style={{}}
            className={styles.textInput}
            key={`${index}/${k}`}
            defaultValue={k.key || 'LABEL_VALUE'}
            onBlur={(e) => {
              this.onValueChange(e.currentTarget.value.trim(), k.value, index, e);
            }}
            onKeyDown={(e) => {
              this.onValueChange(e.currentTarget.value.trim(), k.value, index, e);
            }}
            prefix={prefix}
            suffix={<Icon className={styles.trashIcon} name="trash-alt" onClick={() => this.onRemoveKey(index)} />}
          />
        );
      });
    }
    return (
      <div>
        {inputs}
        {showAdd ? (
          <Input
            style={{}}
            autoFocus
            className={styles.textInput}
            placeholder="Add key"
            defaultValue={''}
            onBlur={(e) => this.onValueChange(e.currentTarget.value.trim(), '<div></div>', -1, e)}
            onKeyDown={(e) => this.onValueChange(e.currentTarget.value.trim(), '<div></div>', -1, e)}
            suffix={<Icon name="plus-circle" />}
          />
        ) : (
          <Button icon="plus" size="sm" variant="secondary" onClick={() => this.setState({ showAdd: true })}>
            Add override
          </Button>
        )}
      </div>
    );
  }
}
