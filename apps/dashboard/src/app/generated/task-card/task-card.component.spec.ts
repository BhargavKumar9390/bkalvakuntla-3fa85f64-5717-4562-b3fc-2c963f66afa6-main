import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { of } from 'rxjs';

describe('TaskCardComponent', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let component: TaskCardComponent;
  const mockAuth = {
    hasPermission: jest.fn().mockReturnValue(true),
  } as Partial<AuthService> as AuthService;
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
  } as Partial<ToastService> as ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    component.task = { id: 't1', title: 'My Task' } as any;
    fixture.detectChanges();
  });

  it('shows confirmation overlay when delete clicked and emits delete on confirm', () => {
    const deleteSpy = jest.fn();
    component.delete.subscribe(deleteSpy);

    // initial state
    expect(component.confirmingDelete).toBe(false);

    // simulate clicking delete in menu
    component.handleDelete();
    fixture.detectChanges();
    expect(component.confirmingDelete).toBe(true);

    // confirm
    component.confirmDelete();
    expect(deleteSpy).toHaveBeenCalledWith(component.task);
    expect(component.confirmingDelete).toBe(false);
  });
});
