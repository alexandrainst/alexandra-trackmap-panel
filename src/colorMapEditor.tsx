import { FieldConfigEditorProps, GrafanaTheme, StringFieldConfigSettings } from '@grafana/data';
import React from 'react';
import { Button, ColorPicker, getTheme, Icon, Input, stylesFactory } from '@grafana/ui';
import { css } from '@emotion/css';

export interface LabelColor {
  label: string;
  color: string;
}

interface ColorMapEditorState {
  showAdd: boolean;
}

type ColorMapEditorProps = FieldConfigEditorProps<LabelColor[], StringFieldConfigSettings>;

export default class ColorMapEditor extends React.PureComponent<ColorMapEditorProps, ColorMapEditorState> {
  state: ColorMapEditorState = {
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

  onValueChange = (label: string, color: string, idx: number, e?: React.SyntheticEvent) => {
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
      if (label) {
        if (e) {
          const evt = e as React.KeyboardEvent<HTMLInputElement>;
          evt.currentTarget.value = ''; // reset last value
        }
        onChange([...value, { label: label, color: color }]);
      }
      this.setState({ showAdd: false });
      return;
    }

    if (!label) {
      return this.onRemoveKey(idx);
    }

    const copy = [...value];
    copy[idx] = { label: label, color: color };
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
            <div className={styles.colorPicker}>
              <ColorPicker
                color={k.color || 'black'}
                onChange={(val) => {
                  this.onValueChange(k.label, val, index);
                }}
                enableNamedColors={true}
              />
            </div>
          </div>
        );
        return (
          <Input
            style={{}}
            className={styles.textInput}
            key={`${index}/${k}`}
            defaultValue={k.label || ''}
            onBlur={(e) => {
              this.onValueChange(e.currentTarget.value.trim(), k.color, index, e);
            }}
            onKeyDown={(e) => {
              this.onValueChange(e.currentTarget.value.trim(), k.color, index, e);
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
            onBlur={(e) => this.onValueChange(e.currentTarget.value.trim(), 'black', -1, e)}
            onKeyDown={(e) => this.onValueChange(e.currentTarget.value.trim(), 'black', -1, e)}
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

export const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    colorPicker: css`
      padding: 0 ${theme.spacing.sm};
    `,
    inputPrefix: css`
      display: flex;
      align-items: center;
    `,

    textInput: css`
      margin-bottom: 5px;
      &:hover {
        border: 1px solid ${theme.colors.formInputBorderHover};
      }
    `,
    trashIcon: css`
      color: ${theme.colors.textWeak};
      cursor: pointer;

      &:hover {
        color: ${theme.colors.text};
      }
    `,
  };
});
