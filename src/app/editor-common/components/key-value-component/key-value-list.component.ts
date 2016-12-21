import {Component, forwardRef, Input} from "@angular/core";
import {NG_VALUE_ACCESSOR, ControlValueAccessor, FormGroup, FormControl} from "@angular/forms";
import {ExpressionModel} from "cwlts/models/d2sb";
import {ComponentBase} from "../../../components/common/component-base";
import {GuidService} from "../../../services/guid.service";

require("./key-value-input.component.scss");

@Component({
    selector: "key-value-list",
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => KeyValueListComponent),
            multi: true
        }
    ],
    template: `
           <ct-blank-tool-state *ngIf="!readonly && !keyValueFormList.length"
                         [title]="emptyListText"
                         [buttonText]="addEntryText"
                         [learnMoreURL]="helpLink"
                         (buttonClick)="addEntry()">
           </ct-blank-tool-state>

                <div *ngIf="keyValueFormList.length" class="container">
                    <div class="gui-section-list-title col-sm-12 row">
                        <div class="col-sm-5">{{keyColumnText}}</div>
                        <div class="col-sm-6">{{valueColumnText}}</div>
                    </div>

                    <ul class="gui-section-list">

                        <li ct-key-value-input *ngFor="let entry of keyValueFormList; let i = index"
                                class="col-sm-12 gui-section-list-item clickable row"
                                [context]="context"
                                [formControl]="form.controls[entry.id]"
                                [keyValidator]="keyValidator"
                                [valueValidator]="valueValidator">
                                
                            <div *ngIf="!!entry" class="col-sm-1 align-right">
                                <i title="Delete" class="fa fa-trash text-hover-danger" (click)="removeEntry(entry)"></i>
                            </div>
                        </li>
                        
                    </ul>
                </div>

                <button *ngIf="!readonly && keyValueFormList.length"
                        (click)="addEntry()"
                        type="button"
                        class="btn pl-0 btn-link no-outline no-underline-hover">
                    <i class="fa fa-plus"></i> {{addEntryText}}
                </button>
    `
})

//TODO: remove duplicate keys
export class KeyValueListComponent extends ComponentBase implements ControlValueAccessor {

    @Input()
    public context: {$job: any} = {};

    @Input()
    public addEntryText = "";

    @Input()
    public emptyListText = "";

    @Input()
    public keyColumnText = "Key";

    @Input()
    public valueColumnText = "Value";

    @Input()
    public keyValidator = () => null;

    @Input()
    public valueValidator = () => null;

    @Input()
    public helpLink = "";

    private keyValueFormList: {id: string, model: {key: string, value: string | ExpressionModel}}[] = [];

    private onTouched = () => { };

    private propagateChange = (_) => {};

    private form = new FormGroup({});

    constructor(private guidService: GuidService) {
        super();
    }

    writeValue(keyValueList: {key: string, value: string | ExpressionModel}[]): void {
        this.keyValueFormList = keyValueList.map(entry => {
            return {
                id: this.guidService.generate(),
                model: entry
            }
        });

        this.keyValueFormList.forEach(hint => {
            this.form.addControl(hint.id, new FormControl(hint.model));
        });

        this.tracked = this.form.valueChanges.subscribe(change => {

            const newList = Object.keys(change)
                .filter(key => !!change[key].key.trim())
                .map(key => {
                    return {
                        key: change[key].key,
                        value: change[key].value
                    };
                });

            this.propagateChange(newList);
        });
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    private addEntry(): void {
        const newEntry = {
            id: this.guidService.generate(),
            model: {
                key: "",
                value: new ExpressionModel()
            }
        };

        this.keyValueFormList.push(newEntry);
        this.form.addControl(newEntry.id, new FormControl(newEntry.model));
    }

    private removeEntry(ctrl: {id: string, model: ExpressionModel}): void {
        this.keyValueFormList = this.keyValueFormList.filter(item => item.id !== ctrl.id);
        this.form.removeControl(ctrl.id);
        this.form.markAsDirty();
    }

    ngOnDestroy() {
        this.keyValueFormList.forEach(item => this.form.removeControl(item.id));
        super.ngOnDestroy();
    }
}
