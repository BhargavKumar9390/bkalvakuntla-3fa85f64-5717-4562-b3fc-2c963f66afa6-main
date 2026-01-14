import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HasPermissionDirective } from './has-permission.directive';
import { AuthService } from '../services/auth.service';

class MockAuthService {
  private allowed = false;
  setAllowed(v: boolean) {
    this.allowed = v;
  }
  hasPermission(_p: string) {
    return this.allowed;
  }
}

@Component({
  template: `
    <div>
      <span id="allowed" *hasPermission="'CREATE_TASK'">Allowed</span>
    </div>
  `,
})
class HostComponent {}

describe('HasPermissionDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let mockAuth: MockAuthService;

  beforeEach(async () => {
    mockAuth = new MockAuthService();
    await TestBed.configureTestingModule({
      imports: [HasPermissionDirective],
      declarations: [HostComponent],
      providers: [{ provide: AuthService, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('shows element when permission granted', () => {
    mockAuth.setAllowed(true);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('#allowed'));
    expect(el).toBeTruthy();
    expect(el.nativeElement.textContent).toContain('Allowed');
  });

  it('hides element when permission denied', () => {
    mockAuth.setAllowed(false);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('#allowed'));
    expect(el).toBeNull();
  });
});
