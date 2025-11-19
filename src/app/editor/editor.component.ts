import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Article, ArticlesService } from '../core';

@Component({
  selector: 'app-editor-page',
  templateUrl: './editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent implements OnInit {
  article: Article = {} as Article;
  articleForm: FormGroup;
  tagField = new FormControl();
  errors: Object = {};
  isSubmitting = false;
  hasError = false;

  constructor(
    private articlesService: ArticlesService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef
  ) {
    // use the FormBuilder to create a form group
    this.articleForm = this.fb.group({
      title: '',
      description: '',
      body: '',
      tagList: new FormControl([], this.arrayRequired),
      coverImageUrl: '',
    });

    // Initialized tagList as empty array
    this.article.tagList = [];

    // Optional: subscribe to value changes on the form
    // this.articleForm.valueChanges.subscribe(value => this.updateArticle(value));
  }

  ngOnInit() {
    // If there's an article prefetched, load it
    this.route.data.subscribe((data: { article: Article }) => {
      if (data.article) {
        this.article = data.article;
        this.articleForm.patchValue(data.article);
        this.cd.markForCheck();
      }
    });
  }

  trackByFn(index, item) {
    return index;
  }

  addTag() {
    // retrieve tag control
    const tagControl = this.articleForm.get('tagList');
    const tag = this.tagField.value?.trim();
    // only add tag if it does not exist yet
    if (tag && this.article.tagList.indexOf(tag) < 0) {
      this.article.tagList.push(tag);
      tagControl!.setValue(this.article.tagList);
      tagControl!.updateValueAndValidity()
    }
    // clear the input
    this.tagField.reset('');
  }

  removeTag(tagName: string) {
    this.article.tagList = this.article.tagList.filter(tag => tag !== tagName);
  }

  submitForm() {
   if (this.articleForm.invalid) {
      this.hasError = true;
      return;
    } else {
      this.hasError = false;
    }

    this.isSubmitting = true

    // update the model
    this.updateArticle(this.articleForm.value);

    // post the changes
    this.articlesService.save(this.article).subscribe(
      article => {
        this.router.navigateByUrl('/article/' + article.slug);
        this.cd.markForCheck();
      },
      err => {
        this.errors = err;
        this.isSubmitting = false;
        this.cd.markForCheck();
      }
    );
  }

  updateArticle(values: Object) {
    Object.assign(this.article, values);
  }

  arrayRequired(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return Array.isArray(value) && value.length > 0
    ? null
    : { required: true };
  }

}
