import { TasksComponent } from './tasks.component';
import { of, throwError, Subject } from 'rxjs';

describe('TasksComponent (unit)', () => {
  let comp: TasksComponent;
  let mockTasksSvc: any;
  let mockAuth: any;
  let mockToast: any;
  let mockKb: any;

  beforeEach(() => {
    mockTasksSvc = {
      delete: jest.fn(),
      tasksChanged: new Subject<void>(),
    } as any;
    mockAuth = {
      hasPermission: jest.fn().mockReturnValue(true),
      user: { organizationId: 'org1' },
    } as any;
    mockToast = { success: jest.fn(), error: jest.fn() } as any;
    mockKb = { shortcuts$: of() } as any;

    comp = new TasksComponent(mockTasksSvc, mockAuth, mockToast, mockKb);
    // stub load to avoid HTTP calls during unit test
    comp.load = jest.fn();
  });

  it('calls tasksSvc.delete and shows success on next', () => {
    mockTasksSvc.delete.mockReturnValue(of({}));
    comp.remove({ id: 't1' });
    expect(comp.isLoading).toBe(false);
    expect(mockToast.success).toHaveBeenCalledWith('Task deleted');
  });

  it('shows error toast on delete failure', () => {
    mockTasksSvc.delete.mockReturnValue(
      throwError(() => ({ message: 'boom' }))
    );
    comp.remove({ id: 't2' });
    expect(comp.isLoading).toBe(false);
    expect(mockToast.error).toHaveBeenCalled();
  });
});
